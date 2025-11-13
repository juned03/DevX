package com.example.insurance.config;

import com.example.insurance.domain.Customer;
import com.example.insurance.domain.Policy;
import com.example.insurance.repository.CustomerRepository;
import com.example.insurance.repository.PolicyRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;

@Configuration
public class DataInitializer {
    @Bean CommandLineRunner seed(CustomerRepository customers, PolicyRepository policies) {
        return args -> {
            if (customers.count() == 0) {
                Customer alice = new Customer();
                alice.setEmail("alice@example.com"); alice.setName("Alice Johnson"); alice.setPhone("+1-555-1111");
                customers.save(alice);

                Policy p = new Policy();
                p.setPolicyNumber("POL-10001"); p.setType("auto"); p.setPremium(89.5); p.setCoverage(20000);
                p.setStartDate(LocalDate.parse("2025-01-01")); p.setEndDate(LocalDate.parse("2026-01-01"));
                p.setStatus("active"); p.setCustomer(alice);
                policies.save(p);
            }
        };
    }
}


