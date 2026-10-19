package com.sentinelaudit.backend.controller;

import com.sentinelaudit.backend.dto.AuditLogResponseDto;
import com.sentinelaudit.backend.dto.TimelineResponseDto;
import com.sentinelaudit.backend.entity.AuditLog;
import com.sentinelaudit.backend.exception.BadRequestException;
import com.sentinelaudit.backend.response.PaginatedResponse;
import com.sentinelaudit.backend.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit")
public class AuditLogController {

    @Autowired
    private AuditLogService service;

    // ===========================
    // AUDIT LOG LISTING
    // ===========================
    /**
     * Paginated audit logs, newest first.
     *
     * <p>{@code page} is ZERO-based (0 = first page). {@code search} and
     * {@code operation} are applied by the backend, so the response only
     * contains matching rows and {@code total} reflects the filtered count.
     */
    @GetMapping("/logs")
    public PaginatedResponse<AuditLogResponseDto> getLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String operation) {

        validatePaging(page, pageSize);

        AuditLogService.LogPage result = service.getLogs(page, pageSize, operation, search);

        return PaginatedResponse.<AuditLogResponseDto>builder()
                .data(result.content().stream().map(AuditLogResponseDto::from).toList())
                .total(result.total())
                .page(result.page())
                .pageSize(pageSize)
                .totalPages(result.totalPages())
                .build();
    }

    @GetMapping("/logs/{id}")
    public ResponseEntity<AuditLogResponseDto> getLog(@PathVariable Long id) {
        return ResponseEntity.ok(AuditLogResponseDto.from(service.getLog(id)));
    }

    // ===========================
    // TIMELINE (per-asset history)
    // ===========================
    /**
     * Paginated timeline of audit events, newest first.
     *
     * <p>{@code page} is ZERO-based (0 = first page). {@code assetId},
     * {@code search} and {@code operation} narrow the result server-side;
     * they are never silently ignored.
     */
    @GetMapping("/timeline")
    public PaginatedResponse<TimelineResponseDto> getTimeline(
            @RequestParam(required = false) Long assetId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String operation) {

        validatePaging(page, pageSize);

        // assetId narrows the timeline to one asset. When omitted, every
        // audit record is returned as a timeline event. Filters are applied
        // by the service before pagination, so `total` is the size of the
        // actual (filtered) result set.
        List<AuditLog> logs = service.getTimeline(assetId, operation, search);

        int from = Math.min(page * pageSize, logs.size());
        int to = Math.min(from + pageSize, logs.size());

        return PaginatedResponse.<TimelineResponseDto>builder()
                .data(logs.subList(from, to).stream().map(TimelineResponseDto::from).toList())
                .total(logs.size())
                .page(page)
                .pageSize(pageSize)
                .totalPages(pageSize == 0 ? 0 : (int) Math.ceil((double) logs.size() / pageSize))
                .build();
    }

    @GetMapping("/timeline/entity/{entityId}")
    public List<TimelineResponseDto> getTimelineByEntity(@PathVariable Long entityId) {
        return service.getLogsByAssetId(entityId).stream()
                .map(TimelineResponseDto::from)
                .toList();
    }

    // ===========================
    // LEGACY / FILTERED LOOKUPS
    // ===========================
    @GetMapping("/user/{username}")
    public List<AuditLogResponseDto> getLogsByUser(@PathVariable String username) {
        return service.getLogsByUser(username).stream()
                .map(AuditLogResponseDto::from)
                .toList();
    }

    @GetMapping("/action/{action}")
    public List<AuditLogResponseDto> getLogsByAction(@PathVariable String action) {
        return service.getLogsByAction(action).stream()
                .map(AuditLogResponseDto::from)
                .toList();
    }

    private static void validatePaging(int page, int pageSize) {
        if (page < 0) {
            throw new BadRequestException("page must be >= 0");
        }
        if (pageSize < 1 || pageSize > 200) {
            throw new BadRequestException("pageSize must be between 1 and 200");
        }
    }
}
