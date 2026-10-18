package com.sentinelaudit.backend.repository;

import com.sentinelaudit.backend.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByUsername(String username);

    List<AuditLog> findByAction(String action);

    /** Change history for one asset, newest first. */
    List<AuditLog> findByAssetIdOrderByTimestampDesc(Long assetId);

    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);

    @Query("""
SELECT a.action, COUNT(a)
FROM AuditLog a
GROUP BY a.action
""")
    List<Object[]> getAuditActionCounts();


    List<AuditLog> findTop10ByOrderByTimestampDesc();
}
