package com.sentinelaudit.backend.service;

import com.sentinelaudit.backend.dto.AuditLogResponseDto;
import com.sentinelaudit.backend.entity.AuditLog;
import com.sentinelaudit.backend.exception.NotFoundException;
import com.sentinelaudit.backend.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository repository;

    /** Paginated audit log listing, newest first. */
    public Page<AuditLog> getAllLogs(int page, int pageSize) {
        return repository.findAll(
                PageRequest.of(page, pageSize, Sort.by(Sort.Direction.DESC, "timestamp", "id")));
    }

    /** Every audit record, newest first (unfiltered timeline view). */
    public List<AuditLog> getAllLogsSorted() {
        return repository.findAll(Sort.by(Sort.Direction.DESC, "timestamp", "id"));
    }

    public AuditLog getLog(Long id) {
        AuditLog log = repository.findById(id).orElse(null);
        if (log == null) {
            throw new NotFoundException("Audit log " + id + " does not exist");
        }
        return log;
    }

    public List<AuditLog> getLogsByUser(String username) {
        return repository.findByUsername(username);
    }

    public List<AuditLog> getLogsByAction(String action) {
        return repository.findByAction(action);
    }

    /** Full change history for one asset, newest first (drives the timeline view). */
    public List<AuditLog> getLogsByAssetId(Long assetId) {
        return repository.findByAssetIdOrderByTimestampDesc(assetId);
    }

    /** Mappings to the frontend's AuditLogEntry contract. */
    public static AuditLogResponseDto toDto(AuditLog log) {
        return AuditLogResponseDto.from(log);
    }
}
