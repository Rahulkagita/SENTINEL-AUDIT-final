package com.sentinelaudit.backend.controller;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Regression test for the "created asset does not show up in the list" bug.
 *
 * <p>Root cause: the UI sent a <b>one-based</b> page number to a <b>zero-based</b>
 * API (Spring Data {@code PageRequest}). {@code page=1} returned the
 * <em>second</em> page, which is empty while the instance holds fewer than one
 * full page of assets — so a freshly created asset was invisible on the first
 * visible page while {@code total} reported rows.</p>
 *
 * <p>This test pins the contract: the first page a client sees must map to
 * {@code page=0} on the wire, the created asset must be present on that page,
 * and {@code page=1} must be reported as the second page.</p>
 *
 * <p>Runs on an in-memory H2 database via the {@code test} profile — see
 * {@code src/test/resources/application-test.properties} — <b>not</b> against
 * the PostgreSQL development database.</p>
 */
@SpringBootTest
@ActiveProfiles("test")
class AssetPaginationRegressionTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc() {
        return MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    private String createAsset(String name) throws Exception {
        MvcResult result = mockMvc().perform(post("/api/assets")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"assetName":"%s","assetType":"server",
                                 "description":"pagination regression test asset",
                                 "status":"ACTIVE","ownerName":"QA",
                                 "sourceApplication":"AssetPaginationRegressionTest"}
                                """.formatted(name)))
                .andExpect(status().isCreated())
                .andReturn();
        String body = result.getResponse().getContentAsString();
        String id = JsonPath.read(body, "$.id");
        assertThat(id).as("POST /api/assets must return the created asset id").isNotBlank();
        return id;
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void createdAssetIsVisibleOnTheFirstRequestedPage() throws Exception {
        String uniqueName = "Java Asset Pagination " + System.nanoTime();
        createAsset(uniqueName);

        // The first page the UI requests must be page=0 (zero-based contract).
        MvcResult firstPage = mockMvc().perform(get("/api/assets")
                        .param("page", "0")
                        .param("pageSize", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.data").isArray())
                .andReturn();

        String body = firstPage.getResponse().getContentAsString();
        Number total = JsonPath.read(body, "$.total");
        assertThat(total.longValue()).isGreaterThanOrEqualTo(1);
        assertTrue(
                body.contains(uniqueName),
                "Freshly created asset '" + uniqueName + "' must be listed on page=0 "
                        + "(the first page the UI shows), but it was missing.\n"
                        + "This is the regression: the UI used to send page=1 to a "
                        + "zero-based API, so the first visible page showed an empty "
                        + "result while total=" + total.longValue() + ".");

        // page=1 is the SECOND page: it must be reported as such.
        mockMvc().perform(get("/api/assets")
                        .param("page", "1")
                        .param("pageSize", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.totalPages").value(greaterThanOrEqualTo(1)));
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void createdAssetCanBeReadBackById() throws Exception {
        String uniqueName = "Java Asset Readback " + System.nanoTime();
        String assetId = createAsset(uniqueName);

        MvcResult read = mockMvc().perform(get("/api/assets/" + assetId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value(uniqueName))
                .andReturn();

        String body = read.getResponse().getContentAsString();
        String id = JsonPath.read(body, "$.id");
        assertThat(id).isEqualTo(assetId);
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void firstPageOfResultsIsNotEmptyWhenTotalIsNonZero() throws Exception {
        String uniqueName = "Java Asset Consistency " + System.nanoTime();
        createAsset(uniqueName);

        MvcResult res = mockMvc().perform(get("/api/assets")
                        .param("page", "0")
                        .param("pageSize", "20"))
                .andExpect(status().isOk())
                .andReturn();

        String body = res.getResponse().getContentAsString();
        Number total = JsonPath.read(body, "$.total");
        java.util.List<?> data = JsonPath.read(body, "$.data");
        assertThat(data).as("total=%d but first page (page=0) was empty", total.longValue())
                .isNotEmpty();
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void assetsEndpointIsZeroBasedAndRejectsInvalidPaging() throws Exception {
        mockMvc().perform(get("/api/assets").param("page", "-1"))
                .andExpect(status().isBadRequest());
        mockMvc().perform(get("/api/assets")
                        .param("page", "0")
                        .param("pageSize", "5000"))
                .andExpect(status().isBadRequest());
    }
}
