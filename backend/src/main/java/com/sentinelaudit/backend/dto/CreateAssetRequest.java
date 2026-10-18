package com.sentinelaudit.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateAssetRequest {

    @NotBlank(message = "Asset Name is required")
    private String assetName;      // maps from frontend displayName

    @NotBlank(message = "Asset Type is required")
    private String assetType;      // maps from frontend category

    private String description;

    private String content;

    private String status;

    private String department;

    private String ownerName;

    private String ownerEmail;

    private String risk;

    private String sourceApplication;
}