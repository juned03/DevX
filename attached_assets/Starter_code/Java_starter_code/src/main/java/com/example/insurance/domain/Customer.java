package com.example.insurance.domain;

import jakarta.persistence.*;
import java.util.*;

@Entity
public class Customer {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    @Column(nullable = false, unique = true)
    private String email;
    @Column(nullable = false)
    private String name;
    private String phone;

    @OneToMany(mappedBy = "customer")
    private List<Policy> policies = new ArrayList<>();

    public String getId() { return id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public List<Policy> getPolicies() { return policies; }
}


