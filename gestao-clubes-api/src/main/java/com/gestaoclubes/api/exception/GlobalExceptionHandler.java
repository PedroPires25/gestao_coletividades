package com.gestaoclubes.api.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Object> handleIllegalArgument(IllegalArgumentException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("error", "Pedido inválido");
        String msg = ex.getMessage();
        body.put("message", (msg != null && !msg.isBlank()) ? msg : "Os dados enviados são inválidos. Verifique os campos e tente novamente.");
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Object> handleIllegalState(IllegalStateException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("error", "Estado inválido");
        String msg = ex.getMessage();
        body.put("message", (msg != null && !msg.isBlank()) ? msg : "Estado da operação inválido.");
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Object> handleMessageNotReadable(HttpMessageNotReadableException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("error", "Pedido inválido");
        String detail = ex.getMessage();
        String userMsg = "Erro no formato dos dados enviados. Verifique os campos obrigatórios e os formatos esperados.";
        if (detail != null && detail.contains("Cannot deserialize value of type")) {
            // Extract field name from Jackson error message for a more explicit user message
            int fieldIdx = detail.indexOf("field `");
            if (fieldIdx >= 0) {
                int end = detail.indexOf("`", fieldIdx + 7);
                if (end > fieldIdx + 7) {
                    String fieldName = detail.substring(fieldIdx + 7, end);
                    userMsg = "O campo '" + fieldName + "' tem um formato inválido.";
                }
            }
        }
        body.put("message", userMsg);
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Object> handleResponseStatus(ResponseStatusException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("error", ex.getStatusCode().toString());
        body.put("message", ex.getReason() != null && !ex.getReason().isBlank() ? ex.getReason() : "Erro na operação.");
        return new ResponseEntity<>(body, ex.getStatusCode());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleGeneric(Exception ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("error", "Erro interno");
        body.put("message", "Ocorreu um erro inesperado. Por favor tente novamente.");
        ex.printStackTrace();
        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
