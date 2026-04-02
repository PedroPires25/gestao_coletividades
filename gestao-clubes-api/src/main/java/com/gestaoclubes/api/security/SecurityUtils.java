package com.gestaoclubes.api.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {

    private SecurityUtils() {
    }

    public static Integer currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;

        Object principal = auth.getPrincipal();
        if (principal instanceof JwtUtil.JwtUser jwtUser) {
            return jwtUser.id();
        }

        return null;
    }

    public static String currentEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;

        Object principal = auth.getPrincipal();
        if (principal instanceof JwtUtil.JwtUser jwtUser) {
            return jwtUser.email();
        }

        return null;
    }

    public static String currentRole() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;

        Object principal = auth.getPrincipal();
        if (principal instanceof JwtUtil.JwtUser jwtUser) {
            return jwtUser.role();
        }

        return null;
    }

    public static boolean currentPrivilegiosAtivos() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;

        Object principal = auth.getPrincipal();
        if (principal instanceof JwtUtil.JwtUser jwtUser) {
            return jwtUser.privilegiosAtivos();
        }

        return false;
    }

    public static Integer currentClubeId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;

        Object principal = auth.getPrincipal();
        if (principal instanceof JwtUtil.JwtUser jwtUser) {
            return jwtUser.clubeId();
        }

        return null;
    }

    public static Integer currentModalidadeId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;

        Object principal = auth.getPrincipal();
        if (principal instanceof JwtUtil.JwtUser jwtUser) {
            return jwtUser.modalidadeId();
        }

        return null;
    }

    public static boolean isAdmin() {
        return "ROLE_ADMIN".equals(currentRole());
    }
}