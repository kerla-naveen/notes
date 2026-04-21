package com.minibytes.notes.services;

import com.minibytes.notes.dto.AuthResponse;
import com.minibytes.notes.dto.LoginRequest;
import com.minibytes.notes.dto.RegisterRequest;

public interface AuthService {
    
    AuthResponse register(RegisterRequest registerRequest);
    
    AuthResponse login(LoginRequest loginRequest);
}
