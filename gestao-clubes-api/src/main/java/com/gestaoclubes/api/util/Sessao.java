package com.gestaoclubes.api.util;

public class Sessao {

    private static String email;
    private static int perfilId = -1;
    private static String perfilDescricao;

    public static void iniciarSessao(String emailUser, int perfilIdUser, String perfilDescUser) {
        email = emailUser;
        perfilId = perfilIdUser;
        perfilDescricao = perfilDescUser;
    }

    public static boolean isAutenticado() {
        return email != null && !email.isEmpty();
    }

    public static String getEmail() {
        return email;
    }

    public static int getPerfilId() {
        return perfilId;
    }

    public static String getPerfilDescricao() {
        return perfilDescricao;
    }

    public static boolean isAdmin() {
        if (!isAutenticado() || perfilDescricao == null) return false;
        return perfilDescricao.equalsIgnoreCase("SUPER_ADMIN")
                || perfilDescricao.equalsIgnoreCase("ADMIN")
                || perfilDescricao.equalsIgnoreCase("ADMINISTRADOR");
    }

    public static void terminarSessao() {
        email = null;
        perfilId = -1;
        perfilDescricao = null;
    }
}
