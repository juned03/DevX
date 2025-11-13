package com.example.insurance.domain;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.*;

@Entity
public class Policy {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    @Column(nullable = false, unique = true)
    private String policyNumber;
    @Column(nullable = false)
    private String type;
    private double premium;
    private double coverage;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;

    @ManyToOne(optional = false)
    private Customer customer;

    @OneToMany(mappedBy = "policy")
    private List<Claim> claims = new ArrayList<>();

    public String getId() { return id; }
    public String getPolicyNumber() { return policyNumber; }
    public void setPolicyNumber(String policyNumber) { this.policyNumber = policyNumber; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public double getPremium() { return premium; }
    public void setPremium(double premium) { this.premium = premium; }
    public double getCoverage() { return coverage; }
    public void setCoverage(double coverage) { this.coverage = coverage; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }
    public List<Claim> getClaims() { return claims; }
}


