package com.conventionhall.crm.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // CORS_ORIGINS env var: comma-separated list of allowed origins
        // e.g. "https://your-frontend-url.vercel.app,http://localhost:5173"
        String originsEnv = System.getenv("CORS_ORIGINS");
        String[] origins = (originsEnv != null && !originsEnv.isBlank())
                ? Arrays.stream(originsEnv.split(","))
                        .map(String::trim)
                        .toArray(String[]::new)
                : new String[] { "*" };
        registry.addMapping("/api/**")
                .allowedOrigins(origins)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH")
                .allowedHeaders("*");
    }
}
