package com.crmflow.entity;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class EntityEngineApplication {
    public static void main(String[] args) {
        SpringApplication.run(EntityEngineApplication.class, args);
    }
}
