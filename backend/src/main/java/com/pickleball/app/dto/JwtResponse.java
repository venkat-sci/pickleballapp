package com.pickleball.app.dto;

public record JwtResponse(String token, String email, String name, String photoUrl, String role) {}

