package com.pickleball.app.repository;

import com.pickleball.app.entity.Group;
import com.pickleball.app.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GroupRepository extends JpaRepository<Group, Long> {

  @Query("""
      select distinct g
      from Group g
      join g.members m
      where m.id = :userId
      order by g.name asc
      """)
  List<Group> findAllByMemberId(@Param("userId") Long userId);

    @Modifying
    @Query(value = "DELETE FROM group_members WHERE group_id = :groupId AND user_id = :userId", nativeQuery = true)
    void removeMember(@Param("groupId") Long groupId, @Param("userId") Long userId);

    @Modifying
    @Query(value = "INSERT INTO group_members (group_id, user_id) VALUES (:groupId, :userId) ON CONFLICT DO NOTHING", nativeQuery = true)
    void addMember(@Param("groupId") Long groupId, @Param("userId") Long userId);

    @Query("""
            select u
            from Group g
            join g.members u
            where g.id = :groupId
              and (
                lower(coalesce(u.name, '')) like lower(concat('%', :query, '%'))
                or lower(u.email) like lower(concat('%', :query, '%'))
              )
            """)
    List<User> searchMembers(@Param("groupId") Long groupId, @Param("query") String query);
}
