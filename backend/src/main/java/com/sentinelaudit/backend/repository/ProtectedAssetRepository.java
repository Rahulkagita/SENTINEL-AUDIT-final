package com.sentinelaudit.backend.repository;

import com.sentinelaudit.backend.entity.ProtectedAsset;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List; // Added missing import

public interface ProtectedAssetRepository
        extends JpaRepository<ProtectedAsset, Long> {

    /**
     * Soft-deleted assets are excluded from normal listings.
     * Legacy rows have deleted = NULL, which is treated as NOT deleted.
     */
    @Query("""
        SELECT p FROM ProtectedAsset p
        WHERE p.deleted IS NULL OR p.deleted = false
    """)
    Page<ProtectedAsset> findActive(Pageable pageable);

    @Query("""
        SELECT p.assetType, COUNT(p)
        FROM ProtectedAsset p
        WHERE p.deleted IS NULL OR p.deleted = false
        GROUP BY p.assetType
    """)
    List<Object[]> getAssetTypeCounts();
}
