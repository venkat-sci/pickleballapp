package com.pickleball.app.dto;

public record UserProfileResponse(Long id, String email, String name, String photoUrl, String role) {}
