package com.example.insurance.controller;

import com.example.insurance.repository.ClaimRepository;
import com.example.insurance.repository.PolicyRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    private final PolicyRepository policies; private final ClaimRepository claims;
    public ReportController(PolicyRepository policies, ClaimRepository claims) { this.policies = policies; this.claims = claims; }

    @GetMapping("/summary")
    public Map<String, Object> summary() {
        return Map.of("policyCount", policies.count(), "claimCount", claims.count());
    }
}


