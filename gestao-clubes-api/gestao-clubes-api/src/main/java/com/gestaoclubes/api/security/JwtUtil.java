package com.gestaoclubes.api.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    // ✅ segredo vem do application.properties: jwt.secret
    private final String secret;

    // ✅ expiração em ms vem do application.properties: jwt.expirationMillis
    private final long expirationMillis;

    public JwtUtil(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expirationMillis}") long expirationMillis
    ) {
        this.secret = secret;
        this.expirationMillis = expirationMillis;
    }

    public record JwtUser(int id, String email, String role) {}

    private Key getSigningKey() {
        // JJWT exige chave suficientemente longa para HS256
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(int userId, String email, String role) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + expirationMillis);

        return Jwts.builder()
                .setSubject(email)
                .claim("uid", userId)
                .claim("role", role) // ex: ROLE_ADMIN ou ROLE_USER
                .setIssuedAt(now)
                .setExpiration(exp)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public JwtUser parseToken(String token) throws JwtException {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        String email = claims.getSubject();

        Object uidObj = claims.get("uid");
        int uid = 0;
        if (uidObj instanceof Integer i) uid = i;
        else if (uidObj instanceof Long l) uid = l.intValue();
        else if (uidObj instanceof String s) uid = Integer.parseInt(s);

        String role = (String) claims.get("role"); // ROLE_ADMIN / ROLE_USER

        return new JwtUser(uid, email, role);
    }
}