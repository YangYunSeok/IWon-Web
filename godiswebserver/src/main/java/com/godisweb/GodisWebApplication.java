package com.godisweb;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication(scanBasePackages = "com.godisweb")
@EnableCaching
public class GodisWebApplication {

    public static void main(String[] args) {
        SpringApplication.run(GodisWebApplication.class, args);
    }
}