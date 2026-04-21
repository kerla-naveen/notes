package com.minibytes.notes.services;

import com.minibytes.notes.dto.TaskRequest;
import com.minibytes.notes.dto.TaskResponse;
import com.minibytes.notes.entities.Task;
import com.minibytes.notes.entities.User;
import com.minibytes.notes.exception.ResourceNotFoundException;
import com.minibytes.notes.exception.TaskAccessDeniedException;
import com.minibytes.notes.repositories.TaskRepository;
import com.minibytes.notes.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class TaskServiceImpl implements TaskService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public TaskResponse createTask(TaskRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status(request.getStatus())
                .user(user)
                .build();

        TaskResponse response = toResponse(taskRepository.save(task));
        log.info("Task created: id={}, title={}, user={}", response.getId(), response.getTitle(), username);
        return response;
    }

    @Override
    public List<TaskResponse> getTasks(String username, boolean isAdmin) {
        List<Task> tasks = isAdmin
                ? taskRepository.findAll()
                : taskRepository.findByUser_Username(username);

        return tasks.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public TaskResponse getTaskById(Long id, String username, boolean isAdmin) {
        Task task = findTask(id);
        checkOwnership(task, username, isAdmin);
        return toResponse(task);
    }

    @Override
    public TaskResponse updateTask(Long id, TaskRequest request, String username, boolean isAdmin) {
        Task task = findTask(id);
        checkOwnership(task, username, isAdmin);

        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setStatus(request.getStatus());

        TaskResponse response = toResponse(taskRepository.save(task));
        log.info("Task updated: id={}, user={}", id, username);
        return response;
    }

    @Override
    public void deleteTask(Long id, String username, boolean isAdmin) {
        Task task = findTask(id);
        checkOwnership(task, username, isAdmin);
        taskRepository.delete(task);
        log.info("Task deleted: id={}, user={}", id, username);
    }

    private Task findTask(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
    }

    private void checkOwnership(Task task, String username, boolean isAdmin) {
        if (isAdmin) return;
        if (!task.getUser().getUsername().equals(username)) {
            throw new TaskAccessDeniedException("You do not have permission to access this task");
        }
    }

    private TaskResponse toResponse(Task task) {
        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus())
                .userId(task.getUser().getId())
                .username(task.getUser().getUsername())
                .build();
    }
}
