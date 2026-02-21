package com.pickleball.app.controller;

import com.pickleball.app.entity.Match;
import com.pickleball.app.repository.MatchRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
public class MatchController {

    private final MatchRepository matchRepository;

    public MatchController(MatchRepository matchRepository) {
        this.matchRepository = matchRepository;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<Match> getAllMatches() {
        return matchRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Match> createMatch(@RequestBody Match match) {
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
