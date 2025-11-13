import 'package:flutter/material.dart';

class ReportsPage extends StatelessWidget {
  const ReportsPage({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Reports')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(children: [
          Expanded(child: Card(color: const Color(0xFF121A2E), child: const Padding(padding: EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Analytics', style: TextStyle(fontWeight: FontWeight.w700)),
            SizedBox(height: 8),
            Text('Integrate charts (fl_chart, charts_flutter) here.', style: TextStyle(color: Color(0xFF9AA3B2)))
          ])))),
          const SizedBox(width: 16),
          Expanded(child: Card(color: const Color(0xFF121A2E), child: const Padding(padding: EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Compliance Notes', style: TextStyle(fontWeight: FontWeight.w700)),
            SizedBox(height: 8),
            Text('Placeholder for regulatory reporting or exports.', style: TextStyle(color: Color(0xFF9AA3B2)))
          ]))))
        ]),
      ),
    );
  }
}


