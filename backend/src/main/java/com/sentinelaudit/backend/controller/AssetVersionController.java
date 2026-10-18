package com.sentinelaudit.backend.controller;

import com.sentinelaudit.backend.dto.RestoreVersionResponseDto;
import com.sentinelaudit.backend.dto.VersionResponseDto;
import com.sentinelaudit.backend.exception.BadRequestException;
import com.sentinelaudit.backend.response.PaginatedResponse;
import com.sentinelaudit.backend.service.AssetVersionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/versions")
public class AssetVersionController {

    @Autowired
    private AssetVersionService service;

    /** Version history for one asset (newest first), paged to match the frontend contract. */
    @GetMapping("/asset/{assetId}")
    public PaginatedResponse<VersionResponseDto> getVersions(
            @PathVariable Long assetId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int pageSize) {

        if (page < 0) {
            throw new BadRequestException("page must be >= 0");
        }
        if (pageSize < 1 || pageSize > 200) {
            throw new BadRequestException("pageSize must be between 1 and 200");
        }

        List<VersionResponseDto> all = service.getVersions(assetId);

        int from = Math.min(page * pageSize, all.size());
        int to = Math.min(from + pageSize, all.size());

        return PaginatedResponse.<VersionResponseDto>builder()
                .data(all.subList(from, to))
                .total(all.size())
                .page(page)
                .pageSize(pageSize)
                .totalPages(pageSize == 0 ? 0 : (int) Math.ceil((double) all.size() / pageSize))
                .build();
    }

    /** Read-only single version lookup. */
    @GetMapping("/asset/{assetId}/{version}")
    public ResponseEntity<VersionResponseDto> getVersion(
            @PathVariable Long assetId,
            @PathVariable Integer version) {

        return ResponseEntity.ok(service.getVersion(assetId, version));
    }

    /**
     * Restores an asset to a previous version.
     * Body matches the frontend RestoreVersionRequest:
     *   { "assetId": "3", "versionName": "v2" }
     */
    @PostMapping("/restore")
    public ResponseEntity<RestoreVersionResponseDto> restoreVersion(
            @RequestBody RestoreRequest request) {

        if (request.assetId() == null || request.assetId().isBlank()) {
            throw new BadRequestException("assetId is required");
        }
        if (request.versionName() == null || request.versionName().isBlank()) {
            throw new BadRequestException("versionName is required");
        }

        Long assetId = parseAssetId(request.assetId());
        Integer versionNumber = parseVersionName(request.versionName());

        return ResponseEntity.ok(service.restoreVersion(assetId, versionNumber));
    }

    /** Frontend sends the asset id as a string. */
    private static Long parseAssetId(String raw) {
        try {
            return Long.parseLong(raw.trim());
        } catch (NumberFormatException e) {
            throw new BadRequestException("assetId must be a valid integer");
        }
    }

    /** Frontend sends version names like "v3"; parse the numeric part. */
    private static Integer parseVersionName(String versionName) {
        String digits = versionName.trim();
        if (digits.toLowerCase().startsWith("v")) {
            digits = digits.substring(1);
        }
        try {
            return Integer.parseInt(digits);
        } catch (NumberFormatException e) {
            throw new BadRequestException("versionName must look like 'v3'");
        }
    }

    /** JSON body contract from the existing frontend service. */
    private record RestoreRequest(String assetId, String versionName) {}
}
