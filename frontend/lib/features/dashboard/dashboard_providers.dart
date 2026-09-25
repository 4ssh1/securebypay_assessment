import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../core/api/api_provider.dart';
import '../../core/models/dashboard.dart';

final dashboardProvider =
    FutureProvider.autoDispose.family<DashboardOverview, DashboardPeriod>((ref, period) async {
  ref.keepAlive();
  final api = ref.read(apiClientProvider);
  final response = await api.get('/dashboard', query: {'period': period.value});
  return DashboardOverview.fromJson(response['data'] as Map<String, dynamic>);
});

final growthProvider =
    FutureProvider.autoDispose.family<GrowthChartData, GrowthGranularity>((ref, granularity) async {
  ref.keepAlive();
  final api = ref.read(apiClientProvider);
  final response = await api.get('/dashboard/growth', query: {'granularity': granularity.value});
  return GrowthChartData.fromJson(response['data'] as Map<String, dynamic>);
});