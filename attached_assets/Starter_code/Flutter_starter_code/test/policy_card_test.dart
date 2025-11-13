import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:insurance_portal_flutter/src/models/policy.dart';
import 'package:insurance_portal_flutter/src/widgets/policy_card.dart';

void main() {
  testWidgets('PolicyCard renders policy number and status', (tester) async {
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: PolicyCard(policy: Policy(
          id: 'p1', policyNumber: 'POL-1', type: 'auto', customerName: 'A', premium: 1, coverage: 1, startDate: '2025-01-01', endDate: '2026-01-01', status: 'active'
        )),
      ),
    ));
    expect(find.text('POL-1'), findsOneWidget);
    expect(find.text('active'), findsOneWidget);
  });
}


