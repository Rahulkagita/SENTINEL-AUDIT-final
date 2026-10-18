package com.sentinelaudit.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateAssetRequest {

    private String assetName;

    private String assetType;

    private String description;

    private String content;

    private String status;

    private String department;

    private String ownerName;

    private String ownerEmail;

    private String risk;

    private String sourceApplication;
}