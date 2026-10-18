package com.sentinelaudit.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "protected_assets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProtectedAsset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String assetName;

    @Column(nullable = false)
    private String assetType;

    @Column(length = 1000)
    private String description;

    @Column(length = 5000)
    private String content;

    @Column(nullable = false)
    private String status;

    // Extended metadata fields (added for frontend compatibility)
    private String department;

    private String ownerName;

    private String ownerEmail;

    @Builder.Default
    private String risk = "low";

    @Builder.Default
    private String sourceApplication = "SentinelAudit";

    // Audit Information
    private String createdBy;

    private LocalDateTime createdAt;

    private String updatedBy;

    private LocalDateTime updatedAt;

    // Version Control
    private Integer version;

    // Soft Delete
    @Builder.Default
    private Boolean deleted = false;
}