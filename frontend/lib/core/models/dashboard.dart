import 'shipment.dart';

enum DashboardPeriod {
  thisMonth('this_month', 'This Month'),
  lastMonth('last_month', 'Last Month'),
  thisYear('this_year', 'This Year');

  const DashboardPeriod(this.value, this.label);

  final String value;
  final String label;
}

enum GrowthGranularity {
  year('year', 'Year'),
  month('month', 'Month'),
  week('week', 'Week');

  const GrowthGranularity(this.value, this.label);

  final String value;
  final String label;
}

class KpiMetric {
  const KpiMetric({required this.count, required this.previousCount, this.changePercent});

  factory KpiMetric.fromJson(Map<String, dynamic> json) => KpiMetric(
        count: (json['count'] as num?)?.toInt() ?? 0,
        previousCount: (json['previousCount'] as num?)?.toInt() ?? 0,
        changePercent: (json['changePercent'] as num?)?.toDouble(),
      );

  final int count;
  final int previousCount;
  final double? changePercent;

  bool get isUp => (changePercent ?? 0) >= 0;
}

class WalletSummary {
  const WalletSummary({required this.balance, required this.currency});

  factory WalletSummary.fromJson(Map<String, dynamic> json) => WalletSummary(
        balance: json['balance'] as String? ?? '0.00',
        currency: json['currency'] as String? ?? 'NGN',
      );

  final String balance;
  final String currency;
}

class DashboardSections {
  const DashboardSections({
    required this.wallet,
    required this.growthChart,
    required this.recentShipments,
  });

  factory DashboardSections.fromJson(Map<String, dynamic> json) => DashboardSections(
        wallet: json['wallet'] as bool? ?? false,
        growthChart: json['growthChart'] as bool? ?? false,
        recentShipments: json['recentShipments'] as bool? ?? true,
      );

  final bool wallet;
  final bool growthChart;
  final bool recentShipments;
}

class DashboardOverview {
  const DashboardOverview({
    required this.period,
    required this.scope,
    required this.sections,
    required this.totalShipments,
    required this.totalExports,
    required this.totalImports,
    required this.wallet,
    required this.recentShipments,
  });

  factory DashboardOverview.fromJson(Map<String, dynamic> json) {
    final kpis = json['kpis'] as Map<String, dynamic>? ?? const {};
    final walletJson = json['wallet'] as Map<String, dynamic>?;
    final shipmentsJson = json['recentShipments'] as List<dynamic>? ?? const [];

    return DashboardOverview(
      period: json['period'] as String? ?? DashboardPeriod.thisMonth.value,
      scope: json['scope'] as String? ?? 'own',
      sections: DashboardSections.fromJson(json['sections'] as Map<String, dynamic>? ?? const {}),
      totalShipments: KpiMetric.fromJson(kpis['totalShipments'] as Map<String, dynamic>? ?? const {}),
      totalExports: KpiMetric.fromJson(kpis['totalExports'] as Map<String, dynamic>? ?? const {}),
      totalImports: KpiMetric.fromJson(kpis['totalImports'] as Map<String, dynamic>? ?? const {}),
      wallet: walletJson == null ? null : WalletSummary.fromJson(walletJson),
      recentShipments: shipmentsJson
          .whereType<Map<String, dynamic>>()
          .map(Shipment.fromJson)
          .toList(growable: false),
    );
  }

  final String period;
  final String scope;
  final DashboardSections sections;
  final KpiMetric totalShipments;
  final KpiMetric totalExports;
  final KpiMetric totalImports;
  final WalletSummary? wallet;
  final List<Shipment> recentShipments;
}

class GrowthPoint {
  const GrowthPoint({required this.date, required this.shipments, required this.revenue});

  factory GrowthPoint.fromJson(Map<String, dynamic> json) => GrowthPoint(
        date: DateTime.tryParse(json['date'] as String? ?? '') ?? DateTime.now(),
        shipments: (json['shipments'] as num?)?.toInt() ?? 0,
        revenue: json['revenue'] as String? ?? '0.00',
      );

  final DateTime date;
  final int shipments;
  final String revenue;
}

class GrowthChartData {
  const GrowthChartData({required this.granularity, required this.points});

  factory GrowthChartData.fromJson(Map<String, dynamic> json) {
    final pointsJson = json['points'] as List<dynamic>? ?? const [];
    return GrowthChartData(
      granularity: json['granularity'] as String? ?? GrowthGranularity.year.value,
      points: pointsJson.whereType<Map<String, dynamic>>().map(GrowthPoint.fromJson).toList(growable: false),
    );
  }

  final String granularity;
  final List<GrowthPoint> points;
}