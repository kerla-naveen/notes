package com.minibytes.notes.services;

import com.minibytes.notes.dto.TaskRequest;
import com.minibytes.notes.dto.TaskResponse;

import java.util.List;

public interface TaskService {

    TaskResponse createTask(TaskRequest request, String username);

    List<TaskResponse> getTasks(String username, boolean isAdmin);

    TaskResponse getTaskById(Long id, String username, boolean isAdmin);

    TaskResponse updateTask(Long id, TaskRequest request, String username, boolean isAdmin);

    void deleteTask(Long id, String username, boolean isAdmin);
}
