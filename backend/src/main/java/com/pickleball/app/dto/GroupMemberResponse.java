package com.pickleball.app.dto;

public record GroupMemberResponse(Long id, String email, String name, String photoUrl, boolean guest) {
}
