package com.pickleball.app.controller;

import com.pickleball.app.dto.*;
import com.pickleball.app.entity.GuestPlayer;
import com.pickleball.app.entity.Session;
import com.pickleball.app.entity.User;
import com.pickleball.app.repository.GuestPlayerRepository;
import com.pickleball.app.repository.GroupRepository;
import com.pickleball.app.repository.SessionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private static final String CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final SessionRepository sessionRepository;
    private final GuestPlayerRepository guestPlayerRepository;
    private final GroupRepository groupRepository;

    public SessionController(SessionRepository sessionRepository,
                             GuestPlayerRepository guestPlayerRepository,
                             GroupRepository groupRepository) {
        this.sessionRepository = sessionRepository;
        this.guestPlayerRepository = guestPlayerRepository;
        this.groupRepository = groupRepository;
    }

    /** POST /api/sessions — create a new session (requires auth) */
    @PostMapping
    public ResponseEntity<SessionResponse> createSession(
            @RequestBody CreateSessionRequest request,
            @AuthenticationPrincipal User currentUser) {

        if (request == null || request.name() == null || request.name().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Session name is required");
        }

        String code = generateUniqueCode();
        Session session = new Session(code, request.name().trim(), request.groupId(), currentUser.getId());
        Session saved = sessionRepository.save(session);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved, 0));
    }

    /** GET /api/sessions/my — sessions created by the current user */
    @GetMapping("/my")
    public ResponseEntity<List<SessionResponse>> getMySessions(@AuthenticationPrincipal User currentUser) {
        List<Session> sessions = sessionRepository.findAllByCreatedById(currentUser.getId());
        List<SessionResponse> result = sessions.stream()
                .map(s -> {
                    int count = guestPlayerRepository.findAllBySessionId(s.getId()).size();
                    return toResponse(s, count);
                })
                .toList();
        return ResponseEntity.ok(result);
    }

    /** GET /api/sessions/by-group/{groupId} — sessions for a group */
    @GetMapping("/by-group/{groupId}")
    public ResponseEntity<List<SessionResponse>> getByGroup(@PathVariable Long groupId,
                                                             @AuthenticationPrincipal User currentUser) {
        List<Session> sessions = sessionRepository.findAllByGroupId(groupId);
        List<SessionResponse> result = sessions.stream()
                .map(s -> {
                    int count = guestPlayerRepository.findAllBySessionId(s.getId()).size();
                    return toResponse(s, count);
                })
                .toList();
        return ResponseEntity.ok(result);
    }

    /** GET /api/sessions/{code} — get session details (PUBLIC — no auth needed) */
    @GetMapping("/{code}")
    public ResponseEntity<SessionResponse> getSession(@PathVariable String code) {
        Session session = findByCode(code);
        int count = guestPlayerRepository.findAllBySessionId(session.getId()).size();
        return ResponseEntity.ok(toResponse(session, count));
    }

    /** POST /api/sessions/{code}/join — join by entering your name (PUBLIC) */
    @PostMapping("/{code}/join")
    public ResponseEntity<SessionParticipantResponse> joinSession(
            @PathVariable String code,
            @RequestBody JoinSessionRequest request) {

        if (request == null || request.playerName() == null || request.playerName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Player name is required");
        }

        Session session = findByCode(code);
        if ("CLOSED".equals(session.getStatus())) {
            throw new ResponseStatusException(HttpStatus.GONE, "This session is closed");
        }

        GuestPlayer guest = new GuestPlayer(session.getId(), request.playerName().trim());
        GuestPlayer saved = guestPlayerRepository.save(guest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new SessionParticipantResponse(saved.getId(), saved.getDisplayName(), "GUEST"));
    }

    /** GET /api/sessions/{code}/participants — all participants in this session (PUBLIC) */
    @GetMapping("/{code}/participants")
    public ResponseEntity<List<SessionParticipantResponse>> getParticipants(@PathVariable String code) {
        Session session = findByCode(code);
        List<GuestPlayer> guests = guestPlayerRepository.findAllBySessionId(session.getId());
        List<SessionParticipantResponse> result = guests.stream()
                .map(g -> new SessionParticipantResponse(g.getId(), g.getDisplayName(), "GUEST"))
                .toList();
        return ResponseEntity.ok(result);
    }

    /** PUT /api/sessions/{code}/close — close the session (owner only) */
    @PutMapping("/{code}/close")
    public ResponseEntity<SessionResponse> closeSession(
            @PathVariable String code,
            @AuthenticationPrincipal User currentUser) {
        Session session = findByCode(code);
        if (!session.getCreatedById().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the session creator can close it");
        }
        session.setStatus("CLOSED");
        Session saved = sessionRepository.save(session);
        int count = guestPlayerRepository.findAllBySessionId(saved.getId()).size();
        return ResponseEntity.ok(toResponse(saved, count));
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private Session findByCode(String code) {
        return sessionRepository.findByCode(code.toUpperCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));
    }

    private String generateUniqueCode() {
        String code;
        int attempts = 0;
        do {
            code = randomCode();
            if (++attempts > 20) throw new IllegalStateException("Could not generate a unique code");
        } while (sessionRepository.existsByCode(code));
        return code;
    }

    private String randomCode() {
        StringBuilder sb = new StringBuilder(8);
        // Format: XXXX-XXXX  e.g. PCKL-7B2Q
        for (int i = 0; i < 4; i++) sb.append(CHARS.charAt(RANDOM.nextInt(CHARS.length())));
        sb.append('-');
        for (int i = 0; i < 4; i++) sb.append(CHARS.charAt(RANDOM.nextInt(CHARS.length())));
        return sb.toString();
    }

    private SessionResponse toResponse(Session s, int participantCount) {
        String groupName = null;
        if (s.getGroupId() != null) {
            groupName = groupRepository.findById(s.getGroupId())
                    .map(g -> g.getName())
                    .orElse(null);
        }
        return new SessionResponse(
                s.getId(), s.getCode(), s.getName(),
                s.getGroupId(), groupName,
                s.getStatus(), s.getCreatedAt(), participantCount);
    }
}
