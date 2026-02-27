package com.pickleball.app.controller;

import com.pickleball.app.dto.AddGuestMemberRequest;
import com.pickleball.app.dto.AddGroupMemberRequest;
import com.pickleball.app.dto.CreateGroupRequest;
import com.pickleball.app.dto.GroupMemberResponse;
import com.pickleball.app.dto.GroupResponse;
import com.pickleball.app.entity.User;
import com.pickleball.app.service.GroupService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final GroupService groupService;

    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    @GetMapping("/my")
    public ResponseEntity<List<GroupResponse>> getMyGroups(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(groupService.getMyGroups(currentUser.getId()));
    }

    @PostMapping
    public ResponseEntity<GroupResponse> createGroup(
            @RequestBody CreateGroupRequest request,
            @AuthenticationPrincipal User currentUser) {
        if (request == null || request.name() == null || request.name().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Group name is required");
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(groupService.createGroup(request.name(), currentUser.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        groupService.deleteGroup(id, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/add-member")
    public ResponseEntity<GroupMemberResponse> addMember(
            @PathVariable Long id,
            @RequestBody AddGroupMemberRequest request) {
        if (request == null || request.email() == null || request.email().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Member email is required");
        }
        return ResponseEntity.ok(groupService.addMemberByEmail(id, request.email()));
    }

    /** Add a guest player (name only — no registration required) to a group */
    @PostMapping("/{id}/add-guest")
    public ResponseEntity<GroupMemberResponse> addGuest(
            @PathVariable Long id,
            @RequestBody AddGuestMemberRequest request) {
        if (request == null || request.displayName() == null || request.displayName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Display name is required");
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(groupService.addGuestMember(id, request.displayName()));
    }

    @DeleteMapping("/{groupId}/members/{userId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable Long groupId,
            @PathVariable Long userId,
            @AuthenticationPrincipal User currentUser) {
        groupService.removeMember(groupId, userId, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<GroupMemberResponse>> getMembers(@PathVariable Long id) {
        return ResponseEntity.ok(groupService.getMembers(id));
    }

    @GetMapping("/{groupId}/search-members")
    public ResponseEntity<List<GroupMemberResponse>> searchMembers(
            @PathVariable Long groupId,
            @RequestParam String query) {
        return ResponseEntity.ok(groupService.searchGroupMembers(groupId, query));
    }
}
