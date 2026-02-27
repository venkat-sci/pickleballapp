package com.pickleball.app.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sessions")
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Short human-readable join code, e.g. PCKL-XK7 */
    @Column(nullable = false, unique = true, length = 12)
    private String code;

    /** Friendly name for the session, e.g. "Tuesday Night Courts" */
    @Column(nullable = false)
    private String name;

    /** Optional — if linked to a group the session can show registered members */
    @Column(name = "group_id")
    private Long groupId;

    @Column(name = "created_by_id")
    private Long createdById;

    /** ACTIVE or CLOSED */
    @Column(nullable = false)
    private String status = "ACTIVE";

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public Session() {}

    public Session(String code, String name, Long groupId, Long createdById) {
        this.code = code;
        this.name = name;
        this.groupId = groupId;
        this.createdById = createdById;
        this.createdAt = LocalDateTime.now();
        this.status = "ACTIVE";
    }

    public Long getId() { return id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Long getGroupId() { return groupId; }
    public void setGroupId(Long groupId) { this.groupId = groupId; }
    public Long getCreatedById() { return createdById; }
    public void setCreatedById(Long createdById) { this.createdById = createdById; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
