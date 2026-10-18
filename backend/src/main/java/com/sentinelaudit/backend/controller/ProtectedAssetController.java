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

@RestController
@RequestMapping("/api/assets")
public class ProtectedAssetController {

    @Autowired
    private ProtectedAssetService service;

    @PostMapping
    public ResponseEntity<AssetResponseDto> createAsset(
            @Valid @RequestBody CreateAssetRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(service.createAsset(request));
    }

    @GetMapping
    public PaginatedResponse<AssetResponseDto> getAllAssets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int pageSize) {

        if (page < 0) {
            throw new BadRequestException("page must be >= 0");
        }
        if (pageSize < 1 || pageSize > 200) {
            throw new BadRequestException("pageSize must be between 1 and 200");
        }

        Page<ProtectedAsset> assets = service.getAllAssets(page, pageSize);

        return PaginatedResponse.<AssetResponseDto>builder()
                .data(assets.getContent().stream().map(AssetResponseDto::from).toList())
                .total(assets.getTotalElements())
                .page(assets.getNumber())
                .pageSize(assets.getSize())
                .totalPages(assets.getTotalPages())
                .build();
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
