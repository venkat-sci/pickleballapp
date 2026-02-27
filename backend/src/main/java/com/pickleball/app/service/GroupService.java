package com.pickleball.app.service;

import com.pickleball.app.dto.GroupMemberResponse;
import com.pickleball.app.dto.GroupResponse;
import com.pickleball.app.entity.Group;
import com.pickleball.app.entity.Role;
import com.pickleball.app.entity.User;
import com.pickleball.app.repository.GroupRepository;
import com.pickleball.app.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class GroupService {

    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public GroupService(GroupRepository groupRepository, UserRepository userRepository,
                        PasswordEncoder passwordEncoder) {
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public GroupResponse createGroup(String name, Long creatorId) {
        Group group = new Group(name.trim(), creatorId);
        Group saved = groupRepository.save(group);
        // Use native insert to avoid detached-entity issues
        groupRepository.addMember(saved.getId(), creatorId);
        return toGroupResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<GroupResponse> getMyGroups(Long userId) {
        return groupRepository.findAllByMemberId(userId).stream()
                .map(this::toGroupResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GroupMemberResponse> getMembers(Long groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found"));
        return group.getMembers().stream()
                .sorted(Comparator.comparing(User::getEmail, String.CASE_INSENSITIVE_ORDER))
                .map(this::toMemberResponse)
                .toList();
    }

    @Transactional
    public GroupMemberResponse addMemberByEmail(Long groupId, String email) {
        if (!groupRepository.existsById(groupId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found");
        }
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No registered user found with that email"));
        groupRepository.addMember(groupId, user.getId());
        return toMemberResponse(user);
    }

    /**
     * Creates a lightweight guest account (Role.GUEST) with just a display name
     * and adds them to the group. Guests have a synthetic email and can never log in.
     */
    @Transactional
    public GroupMemberResponse addGuestMember(Long groupId, String displayName) {
        if (!groupRepository.existsById(groupId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found");
        }
        String guestEmail = "guest_" + UUID.randomUUID().toString().replace("-", "") + "@pickleball.local";
        User guest = new User(guestEmail, passwordEncoder.encode(UUID.randomUUID().toString()), Role.GUEST);
        guest.setName(displayName.trim());
        User saved = userRepository.save(guest);
        groupRepository.addMember(groupId, saved.getId());
        return toMemberResponse(saved);
    }

    @Transactional
    public void removeMember(Long groupId, Long userId, Long requesterId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found"));
        // Only the group creator or the member themselves can remove
        boolean isCreator = group.getCreatedById() != null && group.getCreatedById().equals(requesterId);
        boolean isSelf = userId.equals(requesterId);
        if (!isCreator && !isSelf) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to remove this member");
        }
        groupRepository.removeMember(groupId, userId);
    }

    @Transactional
    public void deleteGroup(Long groupId, Long requesterId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found"));
        if (group.getCreatedById() == null || !group.getCreatedById().equals(requesterId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the group creator can delete this group");
        }
        groupRepository.deleteById(groupId);
    }

    @Transactional(readOnly = true)
    public List<GroupMemberResponse> searchGroupMembers(Long groupId, String query) {
        if (query == null || query.isBlank()) return List.of();
        if (!groupRepository.existsById(groupId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found");
        }
        return groupRepository.searchMembers(groupId, query.trim()).stream()
                .map(this::toMemberResponse)
                .toList();
    }

    private GroupResponse toGroupResponse(Group g) {
        return new GroupResponse(g.getId(), g.getName(), g.getCreatedById());
    }

    private GroupMemberResponse toMemberResponse(User u) {
        return new GroupMemberResponse(u.getId(), u.getEmail(), u.getName(), u.getPhotoUrl(),
                u.getRole() == Role.GUEST);
    }
}
