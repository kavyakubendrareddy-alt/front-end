package com.conventionhall.crm.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // CORS_ORIGINS env var: comma-separated list of allowed origins
        // e.g. "https://your-app.vercel.app,http://localhost:5173"
        String originsEnv = System.getenv("CORS_ORIGINS");
        String[] origins = (originsEnv != null && !originsEnv.isBlank())
                ? originsEnv.split(",")
                : new String[] { "http://localhost:5173" };
        registry.addMapping("/api/**")
                .allowedOrigins(origins)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH")
                .allowedHeaders("*");
    }
}
