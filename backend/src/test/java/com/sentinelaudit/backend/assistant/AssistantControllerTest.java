package com.sentinelaudit.backend.assistant;

import com.sentinelaudit.backend.assistant.dto.AssistantChatRequest;
import com.sentinelaudit.backend.assistant.dto.AssistantChatResponse;
import com.sentinelaudit.backend.entity.User;
import com.sentinelaudit.backend.exception.ForbiddenException;
import com.sentinelaudit.backend.exception.UnauthorizedException;
import com.sentinelaudit.backend.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AssistantControllerTest {

    @Mock
    private AssistantService assistantService;
    @Mock
    private UserService userService;

    private final AssistantProperties properties = new AssistantProperties();
    private AssistantController controller;

    @BeforeEach
    void setUp() {
        controller = new AssistantController(assistantService, userService, properties);
    }

    @Test
    void chatDerivesTheActorFromTheAuthenticatedPrincipal() {
        User actor = User.builder().id(9L).fullName("P").email("principal@example.com").role("USER").build();
        when(userService.getAuthenticatedUserOrThrow()).thenReturn(actor);
        AssistantChatRequest request = new AssistantChatRequest("hello", List.of());
        AssistantChatResponse response = new AssistantChatResponse(
                "hi", List.of(), List.of(), "openai-compatible", "gpt-4o-mini", false);
        when(assistantService.chat(request, actor)).thenReturn(response);

        controller.chat(request);

        // The body cannot supply an identity: the principal is what is passed through.
        verify(assistantService).chat(request, actor);
    }

    @Test
    void chatRequiresAuthentication() {
        when(userService.getAuthenticatedUserOrThrow()).thenThrow(new UnauthorizedException("no principal"));

        assertThatThrownBy(() -> controller.chat(new AssistantChatRequest("hi", List.of())))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void statusRequiresAuthentication() {
        when(userService.getAuthenticatedUserOrThrow()).thenThrow(new UnauthorizedException("no principal"));

        assertThatThrownBy(() -> controller.status()).isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void reindexCanBeDisabledByConfiguration() {
        properties.getIndexing().setAllowApi(false);
        when(userService.getAuthenticatedUserOrThrow())
                .thenReturn(User.builder().id(1L).email("a@example.com").build());

        assertThatThrownBy(() -> controller.reindex()).isInstanceOf(ForbiddenException.class);
    }
}
