package com.example.insurance.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Claim {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    @ManyToOne(optional = false)
    private Policy policy;
    private double amount;
    private String description;
    private String status = "pending";
    private LocalDateTime createdAt = LocalDateTime.now();

    public String getId() { return id; }
    public Policy getPolicy() { return policy; }
    public void setPolicy(Policy policy) { this.policy = policy; }
    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}


