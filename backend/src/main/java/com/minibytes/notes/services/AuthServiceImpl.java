package com.minibytes.notes.services;

import com.minibytes.notes.dto.AuthResponse;
import com.minibytes.notes.dto.LoginRequest;
import com.minibytes.notes.dto.RegisterRequest;
import com.minibytes.notes.entities.User;
import com.minibytes.notes.enums.Role;
import com.minibytes.notes.exception.DuplicateResourceException;
import com.minibytes.notes.exception.ResourceNotFoundException;
import com.minibytes.notes.exception.TaskAccessDeniedException;
import com.minibytes.notes.repositories.UserRepository;
import com.minibytes.notes.util.JwtUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class AuthServiceImpl implements AuthService {

    @Value("${app.admin-secret}")
    private String adminSecret;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        validateRegistrationRequest(request);

        Role role = Role.USER;
        if ("ADMIN".equalsIgnoreCase(request.getRole())) {
            if (request.getAdminSecret() == null || !adminSecret.equals(request.getAdminSecret())) {
                throw new TaskAccessDeniedException("Invalid admin secret");
            }
            role = Role.ADMIN;
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .build();

        User savedUser = userRepository.save(user);
        log.info("User registered: username={}, role={}", savedUser.getUsername(), savedUser.getRole());

        return generateAuthResponse(savedUser);
    }

    @Override
    public AuthResponse login(LoginRequest loginRequest) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword())
        );

        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        log.info("User logged in: username={}", user.getUsername());
        return generateAuthResponse(user);
    }

    private void validateRegistrationRequest(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email is already in use");
        }
    }

    private AuthResponse generateAuthResponse(User user) {
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }
}
