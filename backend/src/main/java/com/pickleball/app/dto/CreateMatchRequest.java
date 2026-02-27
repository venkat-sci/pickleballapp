package com.pickleball.app.dto;

import com.pickleball.app.entity.MatchType;

import java.util.List;

public record CreateMatchRequest(
        Long groupId,
        MatchType matchType,
        List<Long> teamOneUserIds,
        List<Long> teamTwoUserIds,
        Integer teamOneScore,
        Integer teamTwoScore
) {
}
