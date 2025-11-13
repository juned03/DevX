package com.example.insurance.service;

import org.springframework.stereotype.Service;

@Service
public class UnderwritingService {
    public Result evaluate(int age, String product, int priorClaims) {
        double risk = (age / 10.0) + (priorClaims * 5.0);
        if ("life".equalsIgnoreCase(product)) risk += 10;
        if ("home".equalsIgnoreCase(product)) risk += 5;
        String decision = risk < 10 ? "approve" : risk < 20 ? "review" : "decline";
        return new Result(Math.round(risk), decision);
    }

    public record Result(long riskScore, String decision) {}
}


