package com.minibytes.notes.services;

import com.minibytes.notes.dto.UserResponse;
import com.minibytes.notes.repositories.TaskRepository;
import com.minibytes.notes.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminServiceImpl implements AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> UserResponse.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .role(user.getRole().name())
                        .taskCount(taskRepository.countByUser_Username(user.getUsername()))
                        .build())
                .collect(Collectors.toList());
    }
}
