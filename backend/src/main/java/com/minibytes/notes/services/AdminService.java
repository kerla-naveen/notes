package com.minibytes.notes.services;

import com.minibytes.notes.dto.UserResponse;

import java.util.List;

public interface AdminService {

    List<UserResponse> getAllUsers();
}
