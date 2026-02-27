package com.pickleball.app.dto;

public record SessionParticipantResponse(
        Long id,
        String displayName,
        String type   // "GUEST" or "REGISTERED"
) {}
