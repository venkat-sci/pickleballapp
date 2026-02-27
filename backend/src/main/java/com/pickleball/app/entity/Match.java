package com.pickleball.app.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "matches")
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

        @ManyToOne(optional = true)
        @JoinColumn(name = "group_id", nullable = true)
        private Group group;

        @Enumerated(EnumType.STRING)
        @Column(nullable = true)
        private MatchType matchType;

        @ManyToMany
        @JoinTable(
            name = "match_team_one_players",
            joinColumns = @JoinColumn(name = "match_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
        )
        private List<User> teamOne = new ArrayList<>();

        @ManyToMany
        @JoinTable(
            name = "match_team_two_players",
            joinColumns = @JoinColumn(name = "match_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
        )
        private List<User> teamTwo = new ArrayList<>();

    private String score;

    @Column(nullable = false)
    private LocalDateTime matchDate;

    public Match() {}

    public Match(Group group, MatchType matchType, List<User> teamOne, List<User> teamTwo, String score, LocalDateTime matchDate) {
        this.group = group;
        this.matchType = matchType;
        this.teamOne = teamOne;
        this.teamTwo = teamTwo;
        this.score = score;
        this.matchDate = matchDate;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Group getGroup() { return group; }
    public void setGroup(Group group) { this.group = group; }

    public MatchType getMatchType() { return matchType; }
    public void setMatchType(MatchType matchType) { this.matchType = matchType; }

    public List<User> getTeamOne() { return teamOne; }
    public void setTeamOne(List<User> teamOne) { this.teamOne = teamOne; }

    public List<User> getTeamTwo() { return teamTwo; }
    public void setTeamTwo(List<User> teamTwo) { this.teamTwo = teamTwo; }

    public String getScore() { return score; }
    public void setScore(String score) { this.score = score; }

    public LocalDateTime getMatchDate() { return matchDate; }
    public void setMatchDate(LocalDateTime matchDate) { this.matchDate = matchDate; }
}
