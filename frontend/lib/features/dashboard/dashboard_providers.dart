import 'package:hooks_riverpod/hooks_riverpod.dart';

final metricsProvider = FutureProvider.autoDispose((ref) async {
  ref.keepAlive(); 
  
  // TODO: Replace with Dio GET request to backend
  await Future.delayed(const Duration(milliseconds: 800));
  return {
    'balance': '3,000,000.28',
    'shipments': 34,
    'exports': 34,
    'imports': 34,
  };
});