package com.sentinelaudit.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    /** Least-privilege default role assigned to newly registered users. */
    public static final String ROLE_USER = "USER";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    /**
     * Accounts registered through the public self-service endpoint receive
     * ROLE_USER only. Admin provisioning is out of scope for this flow.
     *
     * Nullable in the schema so Hibernate's ddl-auto=update can add the
     * column to an existing table without failing; null is treated as USER.
     */
    private String role;

    /** Never null - pre-existing rows (added before this column existed) read as USER. */
    public String getEffectiveRole() {
        return (role == null || role.isBlank()) ? ROLE_USER : role;
    }
}
