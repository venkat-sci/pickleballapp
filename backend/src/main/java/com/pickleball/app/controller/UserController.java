package com.pickleball.app.controller;

import com.pickleball.app.dto.ChangePasswordRequest;
import com.pickleball.app.dto.UpdateProfileRequest;
import com.pickleball.app.dto.UserProfileResponse;
import com.pickleball.app.entity.User;
import com.pickleball.app.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
@PreAuthorize("isAuthenticated()")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /** GET /api/user/profile — return the current user's profile */
    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(toResponse(user));
    }

    /** PUT /api/user/profile — update name and/or photo URL (email is immutable) */
    @PutMapping("/profile")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @AuthenticationPrincipal User user,
            @RequestBody UpdateProfileRequest request) {

        user.setName(request.name() != null ? request.name().trim() : null);
        user.setPhotoUrl(request.photoUrl() != null ? request.photoUrl().trim() : null);
        userRepository.save(user);

        return ResponseEntity.ok(toResponse(user));
    }

    /** PUT /api/user/password — change password (current password required) */
    @PutMapping("/password")
    public ResponseEntity<?> changePassword(
            @AuthenticationPrincipal User user,
            @RequestBody ChangePasswordRequest request) {

        if (request.currentPassword() == null || request.newPassword() == null
                || request.newPassword().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Current and new password are required"));
        }

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Current password is incorrect"));
        }

        if (request.newPassword().length() < 6) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "New password must be at least 6 characters"));
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }

    private UserProfileResponse toResponse(User user) {
        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getPhotoUrl(),
                user.getRole().name()
        );
    }
}
