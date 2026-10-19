package com.sentinelaudit.backend.repository;

import com.sentinelaudit.backend.entity.ProtectedAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ProtectedAssetRepository
        extends JpaRepository<ProtectedAsset, Long>,
                JpaSpecificationExecutor<ProtectedAsset> {

    @Query("""
        SELECT p.assetType, COUNT(p)
        FROM ProtectedAsset p
        WHERE p.deleted IS NULL OR p.deleted = false
        GROUP BY p.assetType
    """)
    List<Object[]> getAssetTypeCounts();
}
