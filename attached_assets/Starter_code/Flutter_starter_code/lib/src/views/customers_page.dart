import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;

class CustomersPage extends StatefulWidget {
  const CustomersPage({super.key});
  @override State<CustomersPage> createState() => _CustomersPageState();
}

class _CustomersPageState extends State<CustomersPage> {
  List<Map<String, dynamic>> customers = [];
  @override void initState() { super.initState(); _load(); }
  Future<void> _load() async {
    final s = await rootBundle.loadString('assets/data/customers.json');
    setState(() { customers = (jsonDecode(s) as List).cast<Map<String,dynamic>>(); });
  }
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Customers')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Card(color: const Color(0xFF121A2E), child: ListView.separated(
          padding: const EdgeInsets.all(8),
          itemCount: customers.length,
          separatorBuilder: (_, __) => const Divider(height: 1),
          itemBuilder: (_, i) => ListTile(
            title: Text(customers[i]['name']),
            subtitle: Text('${customers[i]['email']} • ${customers[i]['phone']}'),
            trailing: Text((customers[i]['policies'] as List).join(', '), style: const TextStyle(color: Color(0xFF9AA3B2))),
          ),
        )),
      ),
    );
  }
}


