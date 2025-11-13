package com.example.insurance.controller;

import com.example.insurance.domain.Customer;
import com.example.insurance.domain.Policy;
import com.example.insurance.repository.CustomerRepository;
import com.example.insurance.repository.PolicyRepository;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/policies")
@Validated
public class PolicyController {
    private final PolicyRepository policies;
    private final CustomerRepository customers;
    public PolicyController(PolicyRepository policies, CustomerRepository customers) {
        this.policies = policies; this.customers = customers;
    }

    @GetMapping
    public List<Policy> list() { return policies.findAll(); }

    record CreatePolicy(@NotBlank String policyNumber, @NotBlank String type, double premium, double coverage,
                        @NotBlank String startDate, @NotBlank String endDate, @NotBlank String status,
                        @NotBlank String customerEmail) {}

    @PostMapping
    public ResponseEntity<Policy> create(@RequestBody CreatePolicy body) {
        Customer c = customers.findByEmail(body.customerEmail()).orElseThrow();
        Policy p = new Policy();
        p.setPolicyNumber(body.policyNumber());
        p.setType(body.type());
        p.setPremium(body.premium());
        p.setCoverage(body.coverage());
        p.setStartDate(LocalDate.parse(body.startDate()));
        p.setEndDate(LocalDate.parse(body.endDate()));
        p.setStatus(body.status());
        p.setCustomer(c);
        return ResponseEntity.status(201).body(policies.save(p));
    }
}


