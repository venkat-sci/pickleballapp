package com.pickleball.app.controller;

import com.pickleball.app.dto.CreateMatchRequest;
import com.pickleball.app.entity.Group;
import com.pickleball.app.entity.Match;
import com.pickleball.app.entity.MatchType;
import com.pickleball.app.entity.User;
import com.pickleball.app.repository.GroupRepository;
import com.pickleball.app.repository.MatchRepository;
import com.pickleball.app.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/matches")
public class MatchController {

    private final MatchRepository matchRepository;
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;

    public MatchController(MatchRepository matchRepository,
                           GroupRepository groupRepository,
                           UserRepository userRepository) {
        this.matchRepository = matchRepository;
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<Match> getAllMatches() {
        return matchRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Match> createMatch(@RequestBody CreateMatchRequest request) {
        if (request == null
                || request.groupId() == null
                || request.matchType() == null
                || request.teamOneUserIds() == null
                || request.teamTwoUserIds() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "groupId, matchType, teamOneUserIds and teamTwoUserIds are required");
        }

        Group group = groupRepository.findById(request.groupId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found"));

        int expectedTeamSize = request.matchType() == MatchType.SINGLES ? 1 : 2;
        if (request.teamOneUserIds().size() != expectedTeamSize
                || request.teamTwoUserIds().size() != expectedTeamSize) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid team size for " + request.matchType().name().toLowerCase());
        }

        Set<Long> uniquePlayerIds = new HashSet<>();
        uniquePlayerIds.addAll(request.teamOneUserIds());
        uniquePlayerIds.addAll(request.teamTwoUserIds());

        int requiredUniquePlayers = expectedTeamSize * 2;
        if (uniquePlayerIds.size() != requiredUniquePlayers) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Each player must be unique in a match");
        }

        Set<Long> groupMemberIds = group.getMembers().stream().map(User::getId).collect(java.util.stream.Collectors.toSet());
        if (!groupMemberIds.containsAll(uniquePlayerIds)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "All selected users must be members of the group");
        }

        List<User> teamOne = userRepository.findAllById(request.teamOneUserIds());
        List<User> teamTwo = userRepository.findAllById(request.teamTwoUserIds());

        if (teamOne.size() != expectedTeamSize || teamTwo.size() != expectedTeamSize) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more selected users were not found");
        }

        Match match = new Match();
        match.setGroup(group);
        match.setMatchType(request.matchType());
        match.setTeamOne(teamOne);
        match.setTeamTwo(teamTwo);
        match.setMatchDate(LocalDateTime.now());

        if (request.teamOneScore() != null && request.teamTwoScore() != null) {
            match.setScore(request.teamOneScore() + "-" + request.teamTwoScore());
        }

        Match saved = matchRepository.save(match);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Match> updateScore(@PathVariable Long id, @RequestBody Match updatedMatch) {
        Match existing = matchRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Match not found with id: " + id));

        existing.setScore(updatedMatch.getScore());
        return ResponseEntity.ok(matchRepository.save(existing));
    }
}
