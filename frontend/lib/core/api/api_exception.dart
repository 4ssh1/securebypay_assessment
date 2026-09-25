class ApiException implements Exception {
  const ApiException({
    required this.statusCode,
    required this.code,
    required this.message,
    this.details,
    this.requestId,
  });

  final int statusCode;
  final String code;
  final String message;
  final Object? details;
  final String? requestId;

  List<String> get validationMessages {
    final value = details;
    if (value is List) return value.whereType<String>().toList();
    return const [];
  }

  int? get retryAfterSeconds {
    final value = details;
    if (value is Map) {
      final raw = value['retryAfterSeconds'];
      if (raw is num) return raw.toInt();
    }
    return null;
  }

  String? get unverifiedUserId {
    final value = details;
    if (value is Map) {
      final raw = value['userId'];
      if (raw is String) return raw;
    }
    return null;
  }

  bool get isNetworkError => code == 'NETWORK_ERROR';

  @override
  String toString() => 'ApiException($statusCode $code: $message)';
}