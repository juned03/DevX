import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import '../models/policy.dart';
import '../services/api_service.dart';
import '../widgets/policy_card.dart';

class PoliciesPage extends StatefulWidget {
  const PoliciesPage({super.key});
  @override State<PoliciesPage> createState() => _PoliciesPageState();
}

class _PoliciesPageState extends State<PoliciesPage> {
  final api = ApiService();
  List<Policy> policies = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final list = await api.listPolicies();
      setState(() { policies = list.map((e)=>Policy.fromJson(e as Map<String,dynamic>)).toList(); });
    } catch (_) {
      final s = await rootBundle.loadString('assets/data/insurancePolicies.json');
      final list = (jsonDecode(s) as List).cast<Map<String,dynamic>>();
      setState(() { policies = list.map((e)=>Policy.fromJson(e)).toList(); });
    } finally {
      setState(() { loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Policies')),
      body: loading ? const Center(child: CircularProgressIndicator()) : Padding(
        padding: const EdgeInsets.all(16),
        child: ListView.separated(
          itemCount: policies.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (_, i) => PolicyCard(policy: policies[i]),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          setState(() {
            policies = [
              Policy(id: DateTime.now().millisecondsSinceEpoch.toString(), policyNumber: 'POL-${policies.length+10000}', type: 'auto', customerName: 'New Customer', premium: 120.5, coverage: 15000, startDate: '2025-01-01', endDate: '2026-01-01', status: 'pending'),
              ...policies
            ];
          });
        },
        label: const Text('Create Demo Policy'),
      ),
    );
  }
}


