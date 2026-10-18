package com.sentinelaudit.backend.repository;

import com.sentinelaudit.backend.entity.AssetVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface AssetVersionRepository extends JpaRepository<AssetVersion, Long> {

    /** Version history for an asset, newest first. */
    List<AssetVersion> findByAssetIdOrderByVersionDesc(Long assetId);

    Optional<AssetVersion> findByAssetIdAndVersion(Long assetId, Integer version);

    @Query("""
SELECT DATE(a.modifiedAt), COUNT(a)
FROM AssetVersion a
GROUP BY DATE(a.modifiedAt)
ORDER BY DATE(a.modifiedAt)
""")
    List<Object[]> getVersionGrowth();

}
