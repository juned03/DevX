class Policy {
  final String id;
  final String policyNumber;
  final String type;
  final String customerName;
  final double premium;
  final double coverage;
  final String startDate;
  final String endDate;
  final String status;

  Policy({required this.id, required this.policyNumber, required this.type, required this.customerName, required this.premium, required this.coverage, required this.startDate, required this.endDate, required this.status});

  factory Policy.fromJson(Map<String, dynamic> j) => Policy(
    id: (j['id'] ?? j['policyNumber']).toString(),
    policyNumber: j['policyNumber'],
    type: j['type'],
    customerName: j['customerName'],
    premium: (j['premium'] as num).toDouble(),
    coverage: (j['coverage'] as num).toDouble(),
    startDate: j['startDate'],
    endDate: j['endDate'],
    status: j['status'],
  );
}


