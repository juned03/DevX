import 'package:flutter/material.dart';
import '../routes.dart';

class DashboardPage extends StatelessWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('🏦 Insurance Portal')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: GridView.count(
          crossAxisCount: MediaQuery.of(context).size.width > 900 ? 2 : 1,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          children: [
            Card(
              color: const Color(0xFF121A2E),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('Quick Links', style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Wrap(spacing: 8, runSpacing: 8, children: [
                    ElevatedButton(onPressed: ()=>Navigator.pushNamed(context, Routes.policies), child: const Text('Policies')),
                    ElevatedButton(onPressed: ()=>Navigator.pushNamed(context, Routes.claims), child: const Text('Claims')),
                    ElevatedButton(onPressed: ()=>Navigator.pushNamed(context, Routes.customers), child: const Text('Customers')),
                    ElevatedButton(onPressed: ()=>Navigator.pushNamed(context, Routes.underwriting), child: const Text('Underwriting')),
                    ElevatedButton(onPressed: ()=>Navigator.pushNamed(context, Routes.reports), child: const Text('Reports')),
                  ])
                ]),
              ),
            ),
            Card(
              color: const Color(0xFF121A2E),
              child: const Padding(
                padding: EdgeInsets.all(16),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Welcome', style: TextStyle(fontWeight: FontWeight.w700)),
                  SizedBox(height: 8),
                  Text('Starter template for an Insurance portal built with Flutter.', style: TextStyle(color: Color(0xFF9AA3B2)))
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}


