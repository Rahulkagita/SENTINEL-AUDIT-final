package com.sentinelaudit.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "asset_versions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssetVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long assetId;

    private Integer version;

    private String assetName;

    private String assetType;

    @Column(length = 1000)
    private String description;

    @Column(length = 5000)
    private String content;

    private String status;

    private String modifiedBy;

    private LocalDateTime modifiedAt;
}