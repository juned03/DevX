import 'dart:convert';
import 'package:flutter/services.dart' show rootBundle;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;

class ApiService {
  final String baseUrl = dotenv.env['API_BASE_URL'] ?? '';

  // Example: GET /api/policies (falls back to local assets for demo)
  Future<List<dynamic>> listPolicies() async {
    if (baseUrl.isEmpty) {
      final s = await rootBundle.loadString('assets/data/insurancePolicies.json');
      return jsonDecode(s) as List<dynamic>;
    }
    final res = await http.get(Uri.parse('$baseUrl/api/policies'));
    return jsonDecode(res.body) as List<dynamic>;
  }

  // Example: POST /api/claims
  Future<Map<String, dynamic>> submitClaim(Map<String, dynamic> payload) async {
    if (baseUrl.isEmpty) {
      // echo demo
      return { 'id': 'cl-${DateTime.now().millisecondsSinceEpoch}', 'status': 'pending', ...payload };
    }
    final res = await http.post(Uri.parse('$baseUrl/api/claims'), headers: { 'Content-Type': 'application/json' }, body: jsonEncode(payload));
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  // Example: POST /api/underwriting/evaluate
  Future<Map<String, dynamic>> evaluateRisk(Map<String, dynamic> payload) async {
    if (baseUrl.isEmpty) {
      // simple local calc
      final age = (payload['age'] ?? 0) as int;
      final product = (payload['product'] ?? 'auto') as String;
      final prior = (payload['priorClaims'] ?? 0) as int;
      var risk = (age / 10.0) + (prior * 5.0);
      if (product == 'life') risk += 10; if (product == 'home') risk += 5;
      final decision = risk < 10 ? 'approve' : risk < 20 ? 'review' : 'decline';
      return { 'riskScore': risk.round(), 'decision': decision };
    }
    final res = await http.post(Uri.parse('$baseUrl/api/underwriting/evaluate'), headers: { 'Content-Type': 'application/json' }, body: jsonEncode(payload));
    return jsonDecode(res.body) as Map<String, dynamic>;
  }
}


