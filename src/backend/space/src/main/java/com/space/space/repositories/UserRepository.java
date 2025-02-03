package com.space.space.repositories;

import com.space.space.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User,String> {
    User save(User user);

    User findByEmail(String email);

}
