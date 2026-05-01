package com.gestaoclubes.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.PropertySource;
import org.springframework.context.annotation.PropertySources;

@SpringBootApplication
@PropertySources({
        @PropertySource(value = "classpath:application.properties", ignoreResourceNotFound = true),
        @PropertySource(value = "file:src/main/resources/application.properties", ignoreResourceNotFound = true),
        @PropertySource(value = "file:gestao-clubes-api/src/main/resources/application.properties", ignoreResourceNotFound = true)
})
public class GestaoClubesApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(GestaoClubesApiApplication.class, args);
    }
}
