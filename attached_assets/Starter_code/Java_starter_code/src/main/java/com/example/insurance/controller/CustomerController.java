package com.example.insurance.controller;

import com.example.insurance.domain.Customer;
import com.example.insurance.repository.CustomerRepository;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {
    private final CustomerRepository customers;
    public CustomerController(CustomerRepository customers) { this.customers = customers; }

    @GetMapping
    public List<Customer> list() { return customers.findAll(); }

    record RegisterCustomer(@Email String email, @NotBlank String name, String phone) {}

    @PostMapping
    public ResponseEntity<Customer> register(@RequestBody RegisterCustomer body) {
        Customer c = new Customer();
        c.setEmail(body.email()); c.setName(body.name()); c.setPhone(body.phone());
        return ResponseEntity.status(201).body(customers.save(c));
    }
}


