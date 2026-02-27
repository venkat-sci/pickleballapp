package com.pickleball.app.dto;

public record JwtResponse(Long id, String token, String email, String name, String photoUrl, String role) {}

