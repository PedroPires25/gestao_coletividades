package com.gestaoclubes.api.security;

public class AuthPrincipal {
    private final int userId;
    private final String email;
    private final String role; // ROLE_SUPER_ADMIN / ROLE_ADMINISTRADOR / ROLE_USER / ...

    public AuthPrincipal(int userId, String email, String role) {
        this.userId = userId;
        this.email = email;
        this.role = role;
    }

    public int getUserId() {
        return userId;
    }

    public String getEmail() {
        return email;
    }

    public String getRole() {
        return role;
    }
}
