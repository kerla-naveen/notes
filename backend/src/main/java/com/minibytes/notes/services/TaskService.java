package com.minibytes.notes.services;

import com.minibytes.notes.dto.TaskRequest;
import com.minibytes.notes.dto.TaskResponse;
import com.minibytes.notes.enums.TaskStatus;

import java.util.List;

public interface TaskService {

    TaskResponse createTask(TaskRequest request, String username);

    List<TaskResponse> getTasks(String username, boolean isAdmin, TaskStatus status);

    TaskResponse getTaskById(Long id, String username, boolean isAdmin);

    TaskResponse updateTask(Long id, TaskRequest request, String username, boolean isAdmin);

    void deleteTask(Long id, String username, boolean isAdmin);
}
