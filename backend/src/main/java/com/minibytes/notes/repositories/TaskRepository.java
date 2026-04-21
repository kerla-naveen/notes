package com.minibytes.notes.repositories;

import com.minibytes.notes.entities.Task;
import com.minibytes.notes.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByUser_Username(String username);

    List<Task> findByUser_UsernameAndStatus(String username, TaskStatus status);

    List<Task> findByStatus(TaskStatus status);

    long countByUser_Username(String username);

    Optional<Task> findByIdAndUser_Username(Long id, String username);
}
