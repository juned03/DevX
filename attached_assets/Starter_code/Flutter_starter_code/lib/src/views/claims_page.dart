import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import '../services/api_service.dart';

class ClaimsPage extends StatefulWidget {
  const ClaimsPage({super.key});
  @override State<ClaimsPage> createState() => _ClaimsPageState();
}

class _ClaimsPageState extends State<ClaimsPage> {
  final api = ApiService();
  List<Map<String, dynamic>> claims = [];
  final policyCtrl = TextEditingController();
  final descCtrl = TextEditingController();
  final amountCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final s = await rootBundle.loadString('assets/data/claims.json');
    setState(() { claims = (jsonDecode(s) as List).cast<Map<String,dynamic>>(); });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Claims')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Expanded(child: Card(color: const Color(0xFF121A2E), child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Submit a Claim', style: TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            TextField(controller: policyCtrl, decoration: const InputDecoration(labelText: 'Policy Number')),
            const SizedBox(height: 8),
            TextField(controller: descCtrl, decoration: const InputDecoration(labelText: 'Description'), maxLines: 3),
            const SizedBox(height: 8),
            TextField(controller: amountCtrl, decoration: const InputDecoration(labelText: 'Amount'), keyboardType: TextInputType.number),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: () async {
              final payload = { 'policyNumber': policyCtrl.text, 'description': descCtrl.text, 'amount': double.tryParse(amountCtrl.text) ?? 0 };
              final created = await api.submitClaim(payload);
              setState(() { claims = [created, ...claims]; });
              policyCtrl.clear(); descCtrl.clear(); amountCtrl.clear();
            }, child: const Text('Submit Claim'))
          ]))),),
          const SizedBox(width: 16),
          Expanded(child: Card(color: const Color(0xFF121A2E), child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Recent Claims', style: TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            Expanded(child: ListView.separated(
              itemCount: claims.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (_, i) => ListTile(
                title: Text('${claims[i]['policyNumber']} • ${claims[i]['amount']}'),
                trailing: Container(padding: const EdgeInsets.symmetric(horizontal:8, vertical:2), decoration: BoxDecoration(color: const Color(0xFF3A2D12), borderRadius: BorderRadius.circular(999)), child: Text('${claims[i]['status']}', style: const TextStyle(color: Color(0xFFF59E0B), fontSize: 12))),
                subtitle: Text('${claims[i]['description']}'),
              ),
            ))
          ]))))
        ]),
      ),
    );
  }
}


