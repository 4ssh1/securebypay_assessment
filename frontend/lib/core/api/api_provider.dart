import 'package:hooks_riverpod/hooks_riverpod.dart';

import 'api_client.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(baseUrl: 'https://api.snzeshi.tech'); 
});