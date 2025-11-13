import 'package:flutter/material.dart';
import '../models/policy.dart';

class PolicyCard extends StatelessWidget {
  final Policy policy;
  const PolicyCard({super.key, required this.policy});

  Color _statusColor(String s) {
    if (s == 'active') return const Color(0xFF22C55E);
    if (s == 'pending') return const Color(0xFFF59E0B);
    return const Color(0xFFEF4444);
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      color: const Color(0xFF121A2E),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(policy.policyNumber, style: const TextStyle(fontWeight: FontWeight.w700)),
                  Text('${policy.type} • ${policy.customerName}', style: const TextStyle(color: Color(0xFF9AA3B2), fontSize: 12)),
                ]),
                Container(
                  decoration: BoxDecoration(color: _statusColor(policy.status).withOpacity(.15), borderRadius: BorderRadius.circular(999)),
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  child: Text(policy.status, style: TextStyle(color: _statusColor(policy.status), fontSize: 12)),
                )
              ],
            ),
            const SizedBox(height: 12),
            Wrap(spacing: 16, children: [
              Text('Premium: ${policy.premium.toStringAsFixed(2)}'),
              Text('Coverage: ${policy.coverage.toStringAsFixed(0)}'),
              Text('Start: ${policy.startDate}'),
              Text('End: ${policy.endDate}'),
            ])
          ],
        ),
      ),
    );
  }
}


