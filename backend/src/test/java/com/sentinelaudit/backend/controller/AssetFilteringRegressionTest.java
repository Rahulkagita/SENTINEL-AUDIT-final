package com.sentinelaudit.backend.controller;

import com.jayway.jsonpath.JsonPath;
import com.sentinelaudit.backend.entity.ProtectedAsset;
import com.sentinelaudit.backend.repository.ProtectedAssetRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import org.springframework.security.test.context.support.WithMockUser;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Regression tests for server-side asset filtering and pagination.
 *
 * <p>Guards the fixed contract: filters are evaluated in the database so
 * {@code total} is the complete filtered set (a match beyond the first page is
 * still found), pages are ZERO-based, and unknown/invalid query parameters are
 * rejected with 400 instead of being silently ignored.</p>
 *
 * <p>Seeds its own uniquely-tagged rows via the repository so the assertions
 * are independent of whatever else exists in the shared in-memory H2 database
 * used by the {@code test} profile.</p>
 */
@SpringBootTest
@ActiveProfiles("test")
class AssetFilteringRegressionTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private ProtectedAssetRepository repository;

    private MockMvc mockMvc() {
        return MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    /** Unique tag per JVM run so seeded rows never collide with other tests. */
    private static final String TAG = "f" + System.nanoTime();

    private static final String BULK_DEPT = "BulkDept-" + TAG;
    private static final String BULK_PREFIX = "BulkAsset-" + TAG + "-";
    private static final int BULK_COUNT = 130;

    @BeforeEach
    void seed() {
        // Seed exactly once for this test class instance. The DB is shared
        // across contexts (DB_CLOSE_DELAY=-1), so guard on the unique tag.
        boolean alreadySeeded = repository.findAll().stream()
                .anyMatch(a -> a.getAssetName() != null && a.getAssetName().startsWith(BULK_PREFIX));
        if (alreadySeeded) {
            return;
        }

        List<ProtectedAsset> rows = new ArrayList<>();

        // 130 rows: the LAST one (index 129) is the "beyond first 100" marker.
        for (int i = 0; i < BULK_COUNT; i++) {
            rows.add(ProtectedAsset.builder()
                    .assetName(BULK_PREFIX + String.format("%03d", i))
                    .assetType("bulk")
                    .department(BULK_DEPT)
                    .status("ACTIVE")
                    .ownerName("Seed Owner")
                    .ownerEmail("seed-" + TAG + "@example.com")
                    .risk("low")
                    .sourceApplication("FilteringTest")
                    .createdBy("seed")
                    .createdAt(LocalDateTime.now())
                    .updatedBy("seed")
                    .updatedAt(LocalDateTime.now())
                    .version(1)
                    .deleted(false)
                    .build());
        }

        // Status-synonym rows (legacy raw values ACTIVE / INACTIVE).
        rows.add(seed("SynTag-" + TAG + "-a", "ACTIVE"));
        rows.add(seed("SynTag-" + TAG + "-b", "INACTIVE"));
        rows.add(seed("SynTag-" + TAG + "-c", "ERROR"));

        // Risk rows: 25 total, 13 high / 12 low, for slicing assertions.
        for (int i = 0; i < 25; i++) {
            rows.add(seed("RiskTag-" + TAG + "-" + String.format("%02d", i),
                    "ACTIVE", "RiskDept-" + TAG, i % 2 == 0 ? "high" : "low"));
        }

        repository.saveAll(rows);
    }

    private ProtectedAsset seed(String name, String status) {
        return seed(name, status, "SynDept-" + TAG, "low");
    }

    private ProtectedAsset seed(String name, String status, String department, String risk) {
        return ProtectedAsset.builder()
                .assetName(name)
                .assetType("seed")
                .department(department)
                .status(status)
                .ownerName("Seed Owner")
                .ownerEmail("seed-" + TAG + "@example.com")
                .risk(risk)
                .sourceApplication("FilteringTest")
                .createdBy("seed")
                .createdAt(LocalDateTime.now())
                .updatedBy("seed")
                .updatedAt(LocalDateTime.now())
                .version(1)
                .deleted(false)
                .build();
    }

    private int totalFor(String... params) throws Exception {
        var request = get("/api/assets").param("page", "0").param("pageSize", "200");
        for (int i = 0; i < params.length; i += 2) {
            request = request.param(params[i], params[i + 1]);
        }
        MvcResult result = mockMvc().perform(request).andExpect(status().isOk()).andReturn();
        Number total = JsonPath.read(result.getResponse().getContentAsString(), "$.total");
        return total.intValue();
    }

    @Test
    @WithMockUser(username = "filter-tester", roles = {"USER"})
    void searchFindsMatchesBeyondTheFirstPage() throws Exception {
        // The marker is the LAST of 130 rows, i.e. beyond the first 100.
        assertThat(totalFor("search", BULK_PREFIX + "129")).isEqualTo(1);
        // A broad search over the tag still reports the complete set.
        assertThat(totalFor("search", BULK_PREFIX)).isEqualTo(BULK_COUNT);
    }

    @Test
    @WithMockUser(username = "filter-tester", roles = {"USER"})
    void departmentFilterIsCaseInsensitiveSubstring() throws Exception {
        assertThat(totalFor("department", BULK_DEPT)).isEqualTo(BULK_COUNT);

        MvcResult result = mockMvc().perform(get("/api/assets")
                        .param("page", "0")
                        .param("pageSize", "200")
                        .param("department", BULK_DEPT.toLowerCase()))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(result.getResponse().getContentAsString()).contains(BULK_DEPT);
    }

    @Test
    @WithMockUser(username = "filter-tester", roles = {"USER"})
    void statusFilterMatchesMappedUiValuesIncludingLegacyRawValues() throws Exception {
        String tag = "SynTag-" + TAG;
        // Raw ACTIVE maps to UI "connected"; raw INACTIVE maps to "disconnected";
        // raw ERROR maps to "error". The filter must match the UI's value.
        assertThat(totalFor("search", tag, "status", "connected")).isEqualTo(1);
        assertThat(totalFor("search", tag, "status", "disconnected")).isEqualTo(1);
        assertThat(totalFor("search", tag, "status", "error")).isEqualTo(1);
    }

    @Test
    @WithMockUser(username = "filter-tester", roles = {"USER"})
    void riskFilterReportsCompleteTotalAndPagesAreZeroBased() throws Exception {
        String dept = "RiskDept-" + TAG;
        assertThat(totalFor("department", dept, "risk", "high")).isEqualTo(13);
        assertThat(totalFor("department", dept, "risk", "low")).isEqualTo(12);

        // page 0 -> first 10 of 13; page 1 -> remaining 3.
        MvcResult page0 = mockMvc().perform(get("/api/assets")
                        .param("page", "0")
                        .param("pageSize", "10")
                        .param("department", dept)
                        .param("risk", "high"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.total").value(13))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andReturn();
        List<?> page0Data = JsonPath.read(page0.getResponse().getContentAsString(), "$.data");
        assertThat(page0Data).hasSize(10);

        MvcResult page1 = mockMvc().perform(get("/api/assets")
                        .param("page", "1")
                        .param("pageSize", "10")
                        .param("department", dept)
                        .param("risk", "high"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(1))
                .andReturn();
        List<?> page1Data = JsonPath.read(page1.getResponse().getContentAsString(), "$.data");
        assertThat(page1Data).hasSize(3);
    }

    @Test
    @WithMockUser(username = "filter-tester", roles = {"USER"})
    void unsupportedAndInvalidParametersAreRejectedWith400() throws Exception {
        mockMvc().perform(get("/api/assets").param("bogus", "1"))
                .andExpect(status().isBadRequest());

        mockMvc().perform(get("/api/assets").param("sort", "createdAt"))
                .andExpect(status().isBadRequest());

        mockMvc().perform(get("/api/assets").param("status", "not-a-status"))
                .andExpect(status().isBadRequest());

        mockMvc().perform(get("/api/assets").param("risk", "extreme"))
                .andExpect(status().isBadRequest());
    }
}
