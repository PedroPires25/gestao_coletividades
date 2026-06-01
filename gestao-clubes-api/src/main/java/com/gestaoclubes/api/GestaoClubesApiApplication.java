package com.gestaoclubes.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class GestaoClubesApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(GestaoClubesApiApplication.class, args);
    }
}
