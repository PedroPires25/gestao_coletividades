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

    private final String secret;
    private final long expirationMillis;

    public JwtUtil(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expirationMillis}") long expirationMillis
    ) {
        this.secret = secret;
        this.expirationMillis = expirationMillis;
    }

    public record JwtUser(
            int id,
            String email,
            String role,
            boolean privilegiosAtivos,
            Integer clubeId,
            Integer modalidadeId,
            Integer coletividadeId,
            Integer atividadeId
    ) {}

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(int userId, String email, String role, boolean privilegiosAtivos,
                                Integer clubeId, Integer modalidadeId,
                                Integer coletividadeId, Integer atividadeId) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + expirationMillis);

        return Jwts.builder()
                .setSubject(email)
                .claim("uid", userId)
                .claim("role", role)
                .claim("privilegiosAtivos", privilegiosAtivos)
                .claim("clubeId", clubeId)
                .claim("modalidadeId", modalidadeId)
                .claim("coletividadeId", coletividadeId)
                .claim("atividadeId", atividadeId)
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
        int uid = toInt(claims.get("uid"));
        String role = (String) claims.get("role");
        boolean privilegiosAtivos = toBoolean(claims.get("privilegiosAtivos"));
        Integer clubeId = toNullableInt(claims.get("clubeId"));
        Integer modalidadeId = toNullableInt(claims.get("modalidadeId"));
        Integer coletividadeId = toNullableInt(claims.get("coletividadeId"));
        Integer atividadeId = toNullableInt(claims.get("atividadeId"));

        return new JwtUser(uid, email, role, privilegiosAtivos, clubeId, modalidadeId, coletividadeId, atividadeId);
    }

    private int toInt(Object obj) {
        if (obj instanceof Integer i) return i;
        if (obj instanceof Long l) return l.intValue();
        if (obj instanceof String s) return Integer.parseInt(s);
        return 0;
    }

    private Integer toNullableInt(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Integer i) return i;
        if (obj instanceof Long l) return l.intValue();
        if (obj instanceof String s && !s.isBlank()) return Integer.parseInt(s);
        return null;
    }

    private boolean toBoolean(Object obj) {
        if (obj instanceof Boolean b) return b;
        if (obj instanceof String s) return Boolean.parseBoolean(s);
        return false;
    }
}