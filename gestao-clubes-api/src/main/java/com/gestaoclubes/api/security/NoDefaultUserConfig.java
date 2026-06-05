package com.gestaoclubes.api.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

@Configuration
public class NoDefaultUserConfig {

    /**
     * Este bean faz o Spring Boot "desistir" de criar o utilizador predefinido
     * e de imprimir a palavra-passe de segurança gerada.
     *
     * Como usamos JWT, não queremos autenticação por UserDetails aqui.
     */
    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            throw new UsernameNotFoundException("JWT only. No in-memory users.");
        };
    }
}