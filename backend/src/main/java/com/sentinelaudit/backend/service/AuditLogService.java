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

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository repository;

    /** Paginated audit log listing, newest first. */
    public Page<AuditLog> getAllLogs(int page, int pageSize) {
        return repository.findAll(
                PageRequest.of(page, pageSize, Sort.by(Sort.Direction.DESC, "timestamp", "id")));
    }

    /**
     * Paginated audit log listing with optional operation/search filters.
     *
     * <p>Filters are applied by the backend itself, so a filtered request
     * never returns rows that do not match. Unfiltered requests keep using
     * Spring Data's database-level pagination; filtered requests are filtered
     * in memory over the newest-first list and then sliced, which keeps the
     * reported {@code total} correct for the filtered result set.
     *
     * <p>The returned {@code page} echoes the requested (zero-based) page
     * number, even when it is beyond the last page - in that case the content
     * is simply empty while {@code total} still reflects the real result set.
     */
    public LogPage getLogs(int page, int pageSize, String operation, String search) {

        if (!hasText(operation) && !hasText(search)) {
            Page<AuditLog> logs = getAllLogs(page, pageSize);
            return new LogPage(
                    logs.getContent(),
                    Math.toIntExact(logs.getTotalElements()),
                    logs.getNumber(),
                    logs.getTotalPages());
        }

        List<AuditLog> matched = applyFilters(getAllLogsSorted(), operation, search);
        int from = Math.min(page * pageSize, matched.size());
        int to = Math.min(from + pageSize, matched.size());

        return new LogPage(
                new ArrayList<>(matched.subList(from, to)),
                matched.size(),
                page,
                (int) Math.ceil((double) matched.size() / pageSize));
    }

    /** Every audit record, newest first (unfiltered timeline view). */
    public List<AuditLog> getAllLogsSorted() {
        return repository.findAll(Sort.by(Sort.Direction.DESC, "timestamp", "id"));
    }

    /**
     * Timeline events, newest first, optionally narrowed to a single asset
     * and filtered by operation and free-text search.
     *
     * @param assetId   when present, only events for that asset are returned
     * @param operation exact operation match (CREATE/UPDATE/DELETE/...),
     *                  case-insensitive; blank means "any"
     * @param search    case-insensitive substring match against asset name,
     *                  actor, action and remarks; blank means "any"
     */
    public List<AuditLog> getTimeline(Long assetId, String operation, String search) {
        List<AuditLog> logs = (assetId == null)
                ? getAllLogsSorted()
                : getLogsByAssetId(assetId);
        return applyFilters(logs, operation, search);
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

    /**
     * One page of a paginated audit log result.
     *
     * @param content    rows for the requested page (empty when out of range)
     * @param total      total number of matching rows (pre-pagination)
     * @param page       zero-based page number of this page
     * @param totalPages total number of pages
     */
    public record LogPage(List<AuditLog> content, int total, int page, int totalPages) {}

    // ===========================
    // FILTERING HELPERS
    // ===========================

    private static List<AuditLog> applyFilters(List<AuditLog> logs, String operation, String search) {
        String normalizedOperation = hasText(operation) ? operation.trim() : null;
        String query = hasText(search) ? search.trim().toLowerCase(Locale.ROOT) : null;

        if (normalizedOperation == null && query == null) {
            return logs;
        }

        return logs.stream()
                .filter(log -> matchesOperation(log, normalizedOperation))
                .filter(log -> matchesSearch(log, query))
                .toList();
    }

    private static boolean matchesOperation(AuditLog log, String operation) {
        return operation == null
                || (log.getAction() != null && log.getAction().equalsIgnoreCase(operation));
    }

    private static boolean matchesSearch(AuditLog log, String query) {
        if (query == null) {
            return true;
        }
        return containsIgnoreCase(log.getAssetName(), query)
                || containsIgnoreCase(log.getUsername(), query)
                || containsIgnoreCase(log.getAction(), query)
                || containsIgnoreCase(log.getRemarks(), query)
                || (log.getAssetId() != null && String.valueOf(log.getAssetId()).contains(query));
    }

    private static boolean containsIgnoreCase(String value, String query) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(query);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
