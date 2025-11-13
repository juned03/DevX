package com.example.insurance.repository;

import com.example.insurance.domain.Policy;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PolicyRepository extends JpaRepository<Policy, String> {
    Optional<Policy> findByPolicyNumber(String policyNumber);
}


