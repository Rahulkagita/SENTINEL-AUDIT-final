package com.sentinelaudit.backend.controller;

import com.sentinelaudit.backend.dto.AuditLogResponseDto;
import com.sentinelaudit.backend.dto.TimelineResponseDto;
import com.sentinelaudit.backend.entity.AuditLog;
import com.sentinelaudit.backend.exception.BadRequestException;
import com.sentinelaudit.backend.response.PaginatedResponse;
import com.sentinelaudit.backend.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
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
    @GetMapping("/logs")
    public PaginatedResponse<AuditLogResponseDto> getLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int pageSize) {

        validatePaging(page, pageSize);

        Page<AuditLog> logs = service.getAllLogs(page, pageSize);

        return PaginatedResponse.<AuditLogResponseDto>builder()
                .data(logs.getContent().stream().map(AuditLogResponseDto::from).toList())
                .total(logs.getTotalElements())
                .page(logs.getNumber())
                .pageSize(logs.getSize())
                .totalPages(logs.getTotalPages())
                .build();
    }

    @GetMapping("/logs/{id}")
    public ResponseEntity<AuditLogResponseDto> getLog(@PathVariable Long id) {
        return ResponseEntity.ok(AuditLogResponseDto.from(service.getLog(id)));
    }

    // ===========================
    // TIMELINE (per-asset history)
    // ===========================
    @GetMapping("/timeline")
    public PaginatedResponse<TimelineResponseDto> getTimeline(
            @RequestParam(required = false) Long assetId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int pageSize) {

        validatePaging(page, pageSize);

        // assetId narrows the timeline to one asset. When omitted, every
        // audit record is returned as a timeline event.
        List<AuditLog> logs = (assetId == null)
                ? service.getAllLogsSorted()
                : service.getLogsByAssetId(assetId);

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
