package com.example.insurance.controller;

import com.example.insurance.service.UnderwritingService;
import org.springframework.web.bind.annotation.*;

record EvaluateRequest(int age, String product, int priorClaims) {}

@RestController
@RequestMapping("/api/underwriting")
public class UnderwritingController {
    private final UnderwritingService service;
    public UnderwritingController(UnderwritingService service) { this.service = service; }

    @PostMapping("/evaluate")
    public UnderwritingService.Result evaluate(@RequestBody EvaluateRequest req) {
        return service.evaluate(req.age(), req.product(), req.priorClaims());
    }
}


