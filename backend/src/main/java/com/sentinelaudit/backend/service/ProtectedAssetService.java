package com.sentinelaudit.backend.service;

import com.sentinelaudit.backend.dto.AssetResponseDto;
import com.sentinelaudit.backend.dto.CreateAssetRequest;
import com.sentinelaudit.backend.dto.UpdateAssetRequest;
import com.sentinelaudit.backend.entity.AssetVersion;
import com.sentinelaudit.backend.entity.AuditLog;
import com.sentinelaudit.backend.entity.ProtectedAsset;
import com.sentinelaudit.backend.exception.NotFoundException;
import com.sentinelaudit.backend.repository.AssetVersionRepository;
import com.sentinelaudit.backend.repository.AuditLogRepository;
import com.sentinelaudit.backend.repository.ProtectedAssetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ProtectedAssetService {

    @Autowired
    private ProtectedAssetRepository repository;

    @Autowired
    private AssetVersionRepository assetVersionRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserService userService;

    // ===========================
    // CREATE ASSET
    // ===========================
    @Transactional
    public AssetResponseDto createAsset(CreateAssetRequest request) {

        String actor = currentActor();

        ProtectedAsset asset = ProtectedAsset.builder()
                .assetName(request.getAssetName())
                .assetType(request.getAssetType())
                .description(request.getDescription())
                .content(request.getContent())
                .status(defaultIfBlank(request.getStatus(), "ACTIVE"))
                .department(request.getDepartment())
                .ownerName(request.getOwnerName())
                .ownerEmail(request.getOwnerEmail())
                .risk(defaultIfBlank(request.getRisk(), "low"))
                .sourceApplication(defaultIfBlank(request.getSourceApplication(), "SentinelAudit"))
                .createdBy(actor)
                .createdAt(LocalDateTime.now())
                .updatedBy(actor)
                .updatedAt(LocalDateTime.now())
                .version(1)
                .deleted(false)
                .build();

        asset = repository.save(asset);

        createAuditLog(asset, "CREATE", "Asset created", actor);

        return AssetResponseDto.from(asset);
    }

    // ===========================
    // GET ALL ASSETS (paginated)
    // ===========================
    public Page<ProtectedAsset> getAllAssets(int page, int pageSize) {
        return repository.findActive(
                PageRequest.of(page, pageSize, Sort.by(Sort.Direction.DESC, "id")));
    }

    // ===========================
    // GET SINGLE ASSET
    // ===========================
    public ProtectedAsset getAsset(Long id) {
        ProtectedAsset asset = repository.findById(id).orElse(null);
        if (asset == null || Boolean.TRUE.equals(asset.getDeleted())) {
            throw new NotFoundException("Asset " + id + " does not exist");
        }
        return asset;
    }

    // ===========================
    // UPDATE ASSET
    // ===========================
    @Transactional
    public AssetResponseDto updateAsset(Long id, UpdateAssetRequest request) {

        ProtectedAsset asset = getAsset(id);
        String actor = currentActor();

        // 1. Save current state to history BEFORE mutating it
        saveVersion(asset, actor);

        // 2. Update current asset state and increment version
        updateCurrentAsset(asset, request, actor);

        // 3. Write audit record
        createAuditLog(asset, "UPDATE", "Asset updated successfully", actor);

        return AssetResponseDto.from(asset);
    }

    // ===========================
    // DELETE ASSET (soft delete)
    // ===========================
    @Transactional
    public void deleteAsset(Long id) {

        ProtectedAsset asset = getAsset(id);
        String actor = currentActor();

        // Preserve history: snapshot the final state before removal
        saveVersion(asset, actor);

        asset.setDeleted(true);
        asset.setStatus("DELETED");
        asset.setUpdatedBy(actor);
        asset.setUpdatedAt(LocalDateTime.now());
        repository.save(asset);

        createAuditLog(asset, "DELETE", "Asset deleted", actor);
    }

    // ===========================
    // SAVE OLD VERSION
    // ===========================
    private void saveVersion(ProtectedAsset asset, String actor) {

        AssetVersion version = AssetVersion.builder()
                .assetId(asset.getId())
                .version(asset.getVersion())
                .assetName(asset.getAssetName())
                .assetType(asset.getAssetType())
                .description(asset.getDescription())
                .content(asset.getContent())
                .status(asset.getStatus())
                .modifiedBy(actor)
                .modifiedAt(LocalDateTime.now())
                .build();

        assetVersionRepository.save(version);
    }

    // ===========================
    // UPDATE CURRENT ASSET
    // ===========================
    private void updateCurrentAsset(ProtectedAsset asset,
                                    UpdateAssetRequest request,
                                    String actor) {

        asset.setAssetName(request.getAssetName());
        asset.setAssetType(request.getAssetType());
        asset.setDescription(request.getDescription());
        asset.setContent(request.getContent());
        asset.setStatus(defaultIfBlank(request.getStatus(), asset.getStatus()));

        // Extended metadata - only overwrite when the client sent a value
        asset.setDepartment(firstNonBlank(request.getDepartment(), asset.getDepartment()));
        asset.setOwnerName(firstNonBlank(request.getOwnerName(), asset.getOwnerName()));
        asset.setOwnerEmail(firstNonBlank(request.getOwnerEmail(), asset.getOwnerEmail()));
        asset.setRisk(firstNonBlank(request.getRisk(), asset.getRisk()));
        asset.setSourceApplication(firstNonBlank(request.getSourceApplication(), asset.getSourceApplication()));

        asset.setUpdatedBy(actor);
        asset.setUpdatedAt(LocalDateTime.now());
        asset.setVersion((asset.getVersion() == null ? 1 : asset.getVersion()) + 1);

        repository.save(asset);
    }

    // ===========================
    // CREATE AUDIT LOG
    // ===========================
    private void createAuditLog(ProtectedAsset asset,
                                String action,
                                String remarks,
                                String actor) {

        AuditLog log = AuditLog.builder()
                .username(actor)
                .action(action)
                .assetId(asset.getId())
                .assetName(asset.getAssetName())
                .timestamp(LocalDateTime.now())
                .remarks(remarks)
                .build();

        auditLogRepository.save(log);
    }

    // ===========================
    // HELPERS
    // ===========================

    /** Actor for audit records: authenticated user, or an explicit system marker. */
    private String currentActor() {
        var user = userService.getAuthenticatedUser();
        return user != null ? user.getEmail() : "SYSTEM";
    }

    private static String defaultIfBlank(String value, String fallback) {
        return (value == null || value.isBlank()) ? fallback : value;
    }

    private static String firstNonBlank(String preferred, String fallback) {
        return (preferred != null && !preferred.isBlank()) ? preferred : fallback;
    }
}
