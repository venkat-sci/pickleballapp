package com.pickleball.app.repository;

import com.pickleball.app.entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SessionRepository extends JpaRepository<Session, Long> {

    Optional<Session> findByCode(String code);

    @Query("select s from Session s where s.createdById = :userId order by s.createdAt desc")
    List<Session> findAllByCreatedById(@Param("userId") Long userId);

    @Query("select s from Session s where s.groupId = :groupId order by s.createdAt desc")
    List<Session> findAllByGroupId(@Param("groupId") Long groupId);

    boolean existsByCode(String code);
}
