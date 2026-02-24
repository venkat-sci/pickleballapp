package com.pickleball.app.dto;

public record ChangePasswordRequest(String currentPassword, String newPassword) {}
