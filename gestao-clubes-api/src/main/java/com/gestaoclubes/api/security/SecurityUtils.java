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

    public static Integer currentColetividadeId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;

        Object principal = auth.getPrincipal();
        if (principal instanceof JwtUtil.JwtUser jwtUser) {
            return jwtUser.coletividadeId();
        }

        return null;
    }

    public static Integer currentAtividadeId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;

        Object principal = auth.getPrincipal();
        if (principal instanceof JwtUtil.JwtUser jwtUser) {
            return jwtUser.atividadeId();
        }

        return null;
    }

    public static boolean isSuperAdmin() {
        return "ROLE_SUPER_ADMIN".equals(currentRole());
    }

    public static boolean isAdministradorEstrutura() {
        return "ROLE_ADMINISTRADOR".equals(currentRole()) && currentPrivilegiosAtivos();
    }

    public static boolean isAdmin() {
        return isSuperAdmin() || isAdministradorEstrutura();
    }

    public static boolean canManageClube(Integer clubeId) {
        if (clubeId == null) return false;
        if (isSuperAdmin()) return true;
        return isAdministradorEstrutura() && clubeId.equals(currentClubeId());
    }

    public static boolean canManageColetividade(Integer coletividadeId) {
        if (coletividadeId == null) return false;
        if (isSuperAdmin()) return true;
        return isAdministradorEstrutura() && coletividadeId.equals(currentColetividadeId());
    }
}
