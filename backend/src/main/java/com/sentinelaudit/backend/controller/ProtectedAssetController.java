package com.sentinelaudit.backend.controller;

import com.sentinelaudit.backend.dto.AssetResponseDto;
import com.sentinelaudit.backend.dto.CreateAssetRequest;
import com.sentinelaudit.backend.dto.UpdateAssetRequest;
import com.sentinelaudit.backend.exception.BadRequestException;
import com.sentinelaudit.backend.response.PaginatedResponse;
import com.sentinelaudit.backend.service.ProtectedAssetService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.sentinelaudit.backend.entity.ProtectedAsset;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/assets")
public class ProtectedAssetController {

    /** Query parameters GET /api/assets understands. Anything else is rejected. */
    private static final Set<String> ALLOWED_LIST_PARAMS =
            Set.of("page", "pageSize", "search", "department", "status", "risk");

    private static final Set<String> ALLOWED_STATUSES =
            Set.of("connected", "syncing", "error", "disconnected");

    private static final Set<String> ALLOWED_RISKS = Set.of("low", "medium", "high");

    private static final int MAX_FILTER_LENGTH = 200;

    @Autowired
    private ProtectedAssetService service;

    @PostMapping
    public ResponseEntity<AssetResponseDto> createAsset(
            @Valid @RequestBody CreateAssetRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(service.createAsset(request));
    }

    /**
     * Paginated, server-side filtered asset listing.
     *
     * <p>{@code page} is ZERO-based. {@code total} is the size of the complete
     * filtered result set, not just the returned page. Parameters that this
     * endpoint does not support are rejected with 400 instead of being
     * silently ignored.</p>
     */
    @GetMapping
    public PaginatedResponse<AssetResponseDto> getAllAssets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String risk,
            @RequestParam Map<String, String> allParams) {

        rejectUnsupportedParams(allParams);

        if (page < 0) {
            throw new BadRequestException("page must be >= 0");
        }
        if (pageSize < 1 || pageSize > 200) {
            throw new BadRequestException("pageSize must be between 1 and 200");
        }
        requireMaxLength(search, "search");
        requireMaxLength(department, "department");
        requireEnum(status, "status", ALLOWED_STATUSES);
        requireEnum(risk, "risk", ALLOWED_RISKS);

        Page<ProtectedAsset> assets =
                service.getAllAssets(page, pageSize, search, department, status, risk);

        return PaginatedResponse.<AssetResponseDto>builder()
                .data(assets.getContent().stream().map(AssetResponseDto::from).toList())
                .total(assets.getTotalElements())
                .page(assets.getNumber())
                .pageSize(assets.getSize())
                .totalPages(assets.getTotalPages())
                .build();
    }

    private static void rejectUnsupportedParams(Map<String, String> params) {
        List<String> unsupported = params.keySet().stream()
                .filter(key -> !ALLOWED_LIST_PARAMS.contains(key))
                .sorted()
                .toList();
        if (!unsupported.isEmpty()) {
            throw new BadRequestException(
                    "Unsupported query parameter(s): " + String.join(", ", unsupported));
        }
    }

    private static void requireMaxLength(String value, String name) {
        if (value != null && value.length() > MAX_FILTER_LENGTH) {
            throw new BadRequestException(name + " must be at most " + MAX_FILTER_LENGTH + " characters");
        }
    }

    private static void requireEnum(String value, String name, Set<String> allowed) {
        if (value != null && !value.isBlank()
                && !allowed.contains(value.trim().toLowerCase(Locale.ROOT))) {
            throw new BadRequestException(name + " must be one of " + allowed);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssetResponseDto> getAsset(@PathVariable Long id) {
        return ResponseEntity.ok(AssetResponseDto.from(service.getAsset(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssetResponseDto> updateAsset(
            @PathVariable Long id,
            @RequestBody UpdateAssetRequest request) {

        return ResponseEntity.ok(service.updateAsset(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAsset(@PathVariable Long id) {
        service.deleteAsset(id);
        return ResponseEntity.noContent().build();
    }
}
