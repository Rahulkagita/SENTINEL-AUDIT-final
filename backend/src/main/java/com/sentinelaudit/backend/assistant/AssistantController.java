package com.sentinelaudit.backend.assistant;

import com.sentinelaudit.backend.assistant.dto.AssistantChatRequest;
import com.sentinelaudit.backend.assistant.dto.AssistantChatResponse;
import com.sentinelaudit.backend.assistant.dto.AssistantStatusResponse;
import com.sentinelaudit.backend.assistant.dto.ReindexResponse;
import com.sentinelaudit.backend.entity.User;
import com.sentinelaudit.backend.exception.ForbiddenException;
import com.sentinelaudit.backend.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

/**
 * Read-only assistant endpoints.
 *
 * <p>All routes require a valid JWT (enforced centrally by
 * {@code SecurityConfig.anyRequest().authenticated()}); the acting identity is
 * always taken from the server-side principal, never from the request body.</p>
 */
@RestController
@RequestMapping("/api/assistant")
public class AssistantController {

    private static final Logger log = LoggerFactory.getLogger(AssistantController.class);

    private final AssistantService assistantService;
    private final UserService userService;
    private final AssistantProperties properties;

    public AssistantController(AssistantService assistantService,
                              UserService userService,
                              AssistantProperties properties) {
        this.assistantService = assistantService;
        this.userService = userService;
        this.properties = properties;
    }

    /** Configuration/readiness snapshot (no secrets). */
    @GetMapping("/status")
    public AssistantStatusResponse status() {
        userService.getAuthenticatedUserOrThrow();
        return assistantService.status();
    }

    /** Ask the assistant a question. */
    @PostMapping("/chat")
    public AssistantChatResponse chat(@RequestBody(required = false) AssistantChatRequest request) {
        User actor = userService.getAuthenticatedUserOrThrow();
        return assistantService.chat(request, actor);
    }

    /**
     * Re-indexes the approved documentation. Idempotent: unchanged chunks are
     * skipped and never duplicated.
     *
     * <p>Restricted to authenticated users and disabled entirely with
     * {@code assistant.indexing.allow-api=false}. This app has no admin role,
     * so the API gate plus authentication is the documented limit.</p>
     */
    @PostMapping("/reindex")
    public ReindexResponse reindex() {
        User actor = userService.getAuthenticatedUserOrThrow();
        if (!properties.getIndexing().isAllowApi()) {
            throw new ForbiddenException("Re-indexing via the API is disabled");
        }
        log.info("Knowledge re-index requested by {}", actor.getEmail());
        return assistantService.reindex();
    }
}
