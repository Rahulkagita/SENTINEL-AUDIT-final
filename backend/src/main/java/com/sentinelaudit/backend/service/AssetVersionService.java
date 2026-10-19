package com.sentinelaudit.backend.service;

import com.sentinelaudit.backend.dto.RestoreVersionResponseDto;
import com.sentinelaudit.backend.dto.VersionResponseDto;
import com.sentinelaudit.backend.entity.AssetVersion;
import com.sentinelaudit.backend.entity.AuditLog;
import com.sentinelaudit.backend.entity.ProtectedAsset;
import com.sentinelaudit.backend.exception.BadRequestException;
import com.sentinelaudit.backend.exception.NotFoundException;
import com.sentinelaudit.backend.repository.AssetVersionRepository;
import com.sentinelaudit.backend.repository.AuditLogRepository;
import com.sentinelaudit.backend.repository.ProtectedAssetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AssetVersionService {

    @Autowired
    private AssetVersionRepository repository;

    @Autowired
    private ProtectedAssetRepository protectedAssetRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserService userService;

    /** Version history for one asset, newest first. */
    public List<VersionResponseDto> getVersions(Long assetId) {
        ensureAssetExists(assetId);
        return repository.findByAssetIdOrderByVersionDesc(assetId).stream()
                .map(VersionResponseDto::from)
                .toList();
    }

    /** Read-only single version lookup. Never mutates data. */
    public VersionResponseDto getVersion(Long assetId, Integer version) {
        ensureAssetExists(assetId);
        AssetVersion found = repository.findByAssetIdAndVersion(assetId, version)
                .orElseThrow(() -> new NotFoundException(
                        "Version " + version + " not found for asset " + assetId));
        return VersionResponseDto.from(found);
    }

    /**
     * Restores an asset to a previous version.
     *
     * Guarantees:
     *  - existing history is preserved (the pre-restore state is snapshotted)
     *  - a NEW version row is created holding the restored content
     *  - a RESTORE audit event is written with the real actor
     */
    @Transactional
    public RestoreVersionResponseDto restoreVersion(Long assetId, Integer versionNumber) {

        if (versionNumber == null || versionNumber < 1) {
            throw new BadRequestException("version must be a positive integer");
        }

        ProtectedAsset asset = protectedAssetRepository.findById(assetId)
                .filter(a -> !Boolean.TRUE.equals(a.getDeleted()))
                .orElseThrow(() -> new NotFoundException(
                        "Asset " + assetId + " does not exist"));

        AssetVersion target = repository.findByAssetIdAndVersion(assetId, versionNumber)
                .orElseThrow(() -> new NotFoundException(
                        "Version " + versionNumber + " not found for asset " + assetId));

        String actor = currentActor();
        LocalDateTime now = LocalDateTime.now();

        // 1. Preserve the CURRENT state in history before overwriting it.
        recordSnapshot(asset, asset.getVersion(), actor, now);

        // 2. Apply the restored content to the live asset.
        asset.setAssetName(target.getAssetName());
        asset.setAssetType(target.getAssetType());
        asset.setDescription(target.getDescription());
        asset.setContent(target.getContent());
        asset.setStatus(target.getStatus());
        asset.setUpdatedBy(actor);
        asset.setUpdatedAt(now);
        asset.setVersion((asset.getVersion() == null ? 1 : asset.getVersion()) + 1);
        protectedAssetRepository.save(asset);

        // 3. Record the new restored state as the newest version.
        AssetVersion restored = recordSnapshot(asset, asset.getVersion(), actor, now);

        // 4. Audit event.
        auditLogRepository.save(AuditLog.builder()
                .username(actor)
                .action("RESTORE")
                .assetId(asset.getId())
                .assetName(asset.getAssetName())
                .timestamp(now)
                .remarks("Restored version v" + versionNumber)
                .build());

        return RestoreVersionResponseDto.builder()
                .success(true)
                .message("Version v" + versionNumber + " restored successfully")
                .restoredVersion(VersionResponseDto.from(restored))
                .build();
    }

    /**
     * Writes the snapshot for {@code (assetId, version)}, overwriting any row
     * that already has that version number. Version numbers are unique per
     * asset: without this, two consecutive restores could both snapshot the
     * same number and leave duplicate rows that a version lookup cannot
     * resolve deterministically.
     */
    @Transactional
    public AssetVersion recordSnapshot(ProtectedAsset asset,
                                       Integer versionNumber,
                                       String actor,
                                       LocalDateTime modifiedAt) {

        AssetVersion version = repository
                .findByAssetIdAndVersion(asset.getId(), versionNumber)
                .orElseGet(AssetVersion::new);

        version.setAssetId(asset.getId());
        version.setVersion(versionNumber);
        version.setAssetName(asset.getAssetName());
        version.setAssetType(asset.getAssetType());
        version.setDescription(asset.getDescription());
        version.setContent(asset.getContent());
        version.setStatus(asset.getStatus());
        version.setModifiedBy(actor);
        version.setModifiedAt(modifiedAt);

        return repository.save(version);
    }

    /**
     * Version history stays readable after a soft delete (the rows are
     * preserved), so reads only require that the asset row itself exists.
     * Restoring is separately blocked for deleted assets in
     * {@link #restoreVersion(Long, Integer)}.
     */
    private void ensureAssetExists(Long assetId) {
        if (!protectedAssetRepository.existsById(assetId)) {
            throw new NotFoundException("Asset " + assetId + " does not exist");
        }
    }

    private String currentActor() {
        var user = userService.getAuthenticatedUser();
        return user != null ? user.getEmail() : "SYSTEM";
    }
}
