package com.pickleball.app.repository;

import com.pickleball.app.entity.GuestPlayer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GuestPlayerRepository extends JpaRepository<GuestPlayer, Long> {

    List<GuestPlayer> findAllBySessionId(Long sessionId);

    void deleteAllBySessionId(Long sessionId);
}
