package com.pickleball.app.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "matches")
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String playerOne;

    @Column(nullable = false)
    private String playerTwo;

    private String score;

    @Column(nullable = false)
    private LocalDateTime matchDate;

    public Match() {}

    public Match(String playerOne, String playerTwo, String score, LocalDateTime matchDate) {
        this.playerOne = playerOne;
        this.playerTwo = playerTwo;
        this.score = score;
        this.matchDate = matchDate;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPlayerOne() { return playerOne; }
    public void setPlayerOne(String playerOne) { this.playerOne = playerOne; }

    public String getPlayerTwo() { return playerTwo; }
    public void setPlayerTwo(String playerTwo) { this.playerTwo = playerTwo; }

    public String getScore() { return score; }
    public void setScore(String score) { this.score = score; }

    public LocalDateTime getMatchDate() { return matchDate; }
    public void setMatchDate(LocalDateTime matchDate) { this.matchDate = matchDate; }
}
