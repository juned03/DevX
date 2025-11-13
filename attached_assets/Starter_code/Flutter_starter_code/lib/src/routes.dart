import 'package:flutter/material.dart';
import 'views/dashboard_page.dart';
import 'views/policies_page.dart';
import 'views/claims_page.dart';
import 'views/customers_page.dart';
import 'views/underwriting_page.dart';
import 'views/reports_page.dart';

class Routes {
  static const dashboard = '/';
  static const policies = '/policies';
  static const claims = '/claims';
  static const customers = '/customers';
  static const underwriting = '/underwriting';
  static const reports = '/reports';
}

final Map<String, WidgetBuilder> appRoutes = {
  Routes.dashboard: (_) => const DashboardPage(),
  Routes.policies: (_) => const PoliciesPage(),
  Routes.claims: (_) => const ClaimsPage(),
  Routes.customers: (_) => const CustomersPage(),
  Routes.underwriting: (_) => const UnderwritingPage(),
  Routes.reports: (_) => const ReportsPage(),
};


