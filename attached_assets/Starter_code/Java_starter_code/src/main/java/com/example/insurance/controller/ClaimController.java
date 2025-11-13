package com.example.insurance.controller;

import com.example.insurance.domain.Claim;
import com.example.insurance.domain.Policy;
import com.example.insurance.repository.ClaimRepository;
import com.example.insurance.repository.PolicyRepository;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/claims")
public class ClaimController {
    private final ClaimRepository claims; private final PolicyRepository policies;
    public ClaimController(ClaimRepository claims, PolicyRepository policies) { this.claims = claims; this.policies = policies; }

    @GetMapping("/{id}")
    public ResponseEntity<Claim> get(@PathVariable String id) {
        return claims.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    record SubmitClaim(@NotBlank String policyNumber, double amount, String description) {}

    @PostMapping
    public ResponseEntity<Claim> submit(@RequestBody SubmitClaim body) {
        Optional<Policy> p = policies.findByPolicyNumber(body.policyNumber());
        if (p.isEmpty()) return ResponseEntity.badRequest().build();
        Claim c = new Claim();
        c.setPolicy(p.get());
        c.setAmount(body.amount());
        c.setDescription(body.description());
        c.setStatus("pending");
        return ResponseEntity.status(201).body(claims.save(c));
    }
}


