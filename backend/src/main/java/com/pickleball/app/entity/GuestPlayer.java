package com.pickleball.app.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * A person who joined a session via QR-code / join code without registering.
 * They only exist within the lifetime of a session.
 */
@Entity
@Table(name = "guest_players")
public class GuestPlayer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    @Column(nullable = false)
    private String displayName;

    @Column(nullable = false)
    private LocalDateTime joinedAt;

    public GuestPlayer() {}

    public GuestPlayer(Long sessionId, String displayName) {
        this.sessionId = sessionId;
        this.displayName = displayName;
        this.joinedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public LocalDateTime getJoinedAt() { return joinedAt; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }
}
