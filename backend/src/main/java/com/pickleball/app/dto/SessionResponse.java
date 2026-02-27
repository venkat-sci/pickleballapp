package com.pickleball.app.dto;

import java.time.LocalDateTime;

public record SessionResponse(
        Long id,
        String code,
        String name,
        Long groupId,
        String groupName,
        String status,
        LocalDateTime createdAt,
        int participantCount
) {}
