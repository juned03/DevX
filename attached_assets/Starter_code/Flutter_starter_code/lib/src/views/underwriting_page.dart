import 'package:flutter/material.dart';
import '../services/api_service.dart';

class UnderwritingPage extends StatefulWidget {
  const UnderwritingPage({super.key});
  @override State<UnderwritingPage> createState() => _UnderwritingPageState();
}

class _UnderwritingPageState extends State<UnderwritingPage> {
  final api = ApiService();
  int age = 35; String product = 'auto'; int priorClaims = 0;
  Map<String, dynamic>? result;
  bool loading = false;

  Future<void> _eval() async {
    setState(() { loading = true; });
    final r = await api.evaluateRisk({ 'age': age, 'product': product, 'priorClaims': priorClaims });
    setState(() { result = r; loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Underwriting')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(children: [
          Expanded(child: Card(color: const Color(0xFF121A2E), child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Risk Evaluation', style: TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            TextField(decoration: const InputDecoration(labelText: 'Age'), keyboardType: TextInputType.number, onChanged: (v)=>age = int.tryParse(v) ?? 0),
            const SizedBox(height: 8),
            DropdownButtonFormField(value: product, items: const [
              DropdownMenuItem(value: 'auto', child: Text('Auto')),
              DropdownMenuItem(value: 'home', child: Text('Home')),
              DropdownMenuItem(value: 'life', child: Text('Life')),
            ], onChanged: (v)=>setState(()=>product = (v ?? 'auto') as String), decoration: const InputDecoration(labelText: 'Product')),
            const SizedBox(height: 8),
            TextField(decoration: const InputDecoration(labelText: 'Prior Claims'), keyboardType: TextInputType.number, onChanged: (v)=>priorClaims = int.tryParse(v) ?? 0),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: loading ? null : _eval, child: Text(loading ? 'Evaluating...' : 'Evaluate')),
            const SizedBox(height: 12),
            if (result != null) ...[
              Text('Risk Score: ${result!['riskScore']}'),
              Text('Decision: ${result!['decision']}'),
            ]
          ]))),
          const SizedBox(width: 16),
          Expanded(child: Card(color: const Color(0xFF121A2E), child: const Padding(padding: EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Guidelines', style: TextStyle(fontWeight: FontWeight.w700)), SizedBox(height: 8),
            Text('• Auto: higher prior claims increases risk'),
            Text('• Home: property age and location are key factors'),
            Text('• Life: age is primary factor for base risk'),
          ]))))
        ]),
      ),
    );
  }
}


