package com.conventionhall.crm.controller;

import com.conventionhall.crm.config.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final JwtUtil jwtUtil;

    @Value("${app.password}")
    private String appPassword;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String password = body.get("password");
        if (appPassword.equals(password)) {
            String token = jwtUtil.generateToken();
            return ResponseEntity.ok(Map.of("token", token));
        }
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Incorrect password. Please try again."));
    }

    @GetMapping("/verify")
    public ResponseEntity<?> verify() {
        // If this endpoint is reached, the JWT filter already authenticated the request
        return ResponseEntity.ok(Map.of("valid", true));
    }
}
