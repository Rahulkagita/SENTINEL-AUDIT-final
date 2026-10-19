package com.sentinelaudit.backend.service;

import com.sentinelaudit.backend.dto.AssetResponseDto;
import com.sentinelaudit.backend.dto.CreateAssetRequest;
import com.sentinelaudit.backend.dto.UpdateAssetRequest;
import com.sentinelaudit.backend.entity.AuditLog;
import com.sentinelaudit.backend.entity.ProtectedAsset;
import com.sentinelaudit.backend.exception.NotFoundException;
import com.sentinelaudit.backend.repository.AuditLogRepository;
import com.sentinelaudit.backend.repository.ProtectedAssetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class ProtectedAssetService {

    @Autowired
    private ProtectedAssetRepository repository;

    @Autowired
    private AssetVersionService assetVersionService;

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
    // GET ALL ASSETS (filtered + paginated)
    // ===========================
    /**
     * Server-side filtered, paginated listing of active assets.
     *
     * <p>All filters are applied in the database so {@code total} always
     * reflects the <b>complete</b> filtered result set, not just the rows on
     * the current page. A null/blank argument means "no filter".</p>
     *
     * @param search     case-insensitive substring across name/type/department/owner/email, or an exact numeric id
     * @param department case-insensitive substring on department
     * @param status     UI status value (connected/syncing/disconnected/error)
     * @param risk       risk level (low/medium/high)
     */
    public Page<ProtectedAsset> getAllAssets(int page,
                                             int pageSize,
                                             String search,
                                             String department,
                                             String status,
                                             String risk) {

        Specification<ProtectedAsset> spec = activeAssetSpec(search, department, status, risk);
        return repository.findAll(spec,
                PageRequest.of(page, pageSize, Sort.by(Sort.Direction.DESC, "id")));
    }

    private Specification<ProtectedAsset> activeAssetSpec(String search,
                                                          String department,
                                                          String status,
                                                          String risk) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Soft-deleted rows are never listed (legacy rows have deleted = NULL).
            predicates.add(cb.or(cb.isNull(root.get("deleted")), cb.isFalse(root.get("deleted"))));

            if (search != null && !search.isBlank()) {
                String term = search.trim();
                String like = "%" + term.toLowerCase(Locale.ROOT) + "%";
                List<Predicate> matches = new ArrayList<>();
                matches.add(cb.like(cb.lower(cb.coalesce(root.get("assetName"), "")), like));
                matches.add(cb.like(cb.lower(cb.coalesce(root.get("assetType"), "")), like));
                matches.add(cb.like(cb.lower(cb.coalesce(root.get("department"), "")), like));
                matches.add(cb.like(cb.lower(cb.coalesce(root.get("ownerName"), "")), like));
                matches.add(cb.like(cb.lower(cb.coalesce(root.get("ownerEmail"), "")), like));
                try {
                    matches.add(cb.equal(root.get("id"), Long.valueOf(term)));
                } catch (NumberFormatException notANumericId) {
                    // Non-numeric search terms simply do not match on id.
                }
                predicates.add(cb.or(matches.toArray(new Predicate[0])));
            }

            if (department != null && !department.isBlank()) {
                predicates.add(cb.like(
                        cb.lower(cb.coalesce(root.get("department"), "")),
                        "%" + department.trim().toLowerCase(Locale.ROOT) + "%"));
            }

            if (status != null && !status.isBlank()) {
                predicates.add(cb.lower(cb.coalesce(root.get("status"), ""))
                        .in(statusAliases(status)));
            }

            if (risk != null && !risk.isBlank()) {
                predicates.add(cb.equal(
                        cb.lower(cb.coalesce(root.get("risk"), "")),
                        risk.trim().toLowerCase(Locale.ROOT)));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Maps a UI status value to the raw statuses that the DTO's
     * {@code mapStatus} renders as that value, so the filter matches exactly
     * what the user sees (including legacy rows such as "ACTIVE").
     */
    private static List<String> statusAliases(String status) {
        return switch (status.trim().toLowerCase(Locale.ROOT)) {
            case "connected" -> List.of("connected", "active");
            case "disconnected" -> List.of("disconnected", "inactive");
            case "error" -> List.of("error");
            case "syncing" -> List.of("syncing");
            default -> List.of(status.trim().toLowerCase(Locale.ROOT));
        };
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
        assetVersionService.recordSnapshot(
                asset, asset.getVersion(), actor, LocalDateTime.now());
        }

    // ===========================
    // UPDATE CURRENT ASSET
    // ===========================
    private void updateCurrentAsset(ProtectedAsset asset,
                                    UpdateAssetRequest request,
                                    String actor) {

        // assetName/assetType are required on the stored row: only overwrite
        // when the client supplied a non-blank value.
        if (request.getAssetName() != null && !request.getAssetName().isBlank()) {
            asset.setAssetName(request.getAssetName());
        }
        if (request.getAssetType() != null && !request.getAssetType().isBlank()) {
            asset.setAssetType(request.getAssetType());
        }
        // description/content are optional free text. `null` means the client
        // did not send the field (a partial body) -> keep the stored value, so
        // an ordinary metadata edit can never blank them out. An explicit
        // empty string clears the field.
        if (request.getDescription() != null) {
            asset.setDescription(request.getDescription());
        }
        if (request.getContent() != null) {
            asset.setContent(request.getContent());
        }
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
