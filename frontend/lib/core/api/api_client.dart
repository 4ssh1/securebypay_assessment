import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;

import 'api_exception.dart';
import '../network/create_http_client.dart';
import 'session_cookie_store.dart';

class ApiClient {
  ApiClient({required String baseUrl, http.Client? client})
      : _baseUrl = baseUrl,
        _client = client ?? createPlatformHttpClient();

  final String _baseUrl;
  final http.Client _client;
  String? _cookie;
  bool _cookieLoaded = false;

  Future<Map<String, dynamic>> get(String path, {Map<String, dynamic>? query}) =>
      _send('GET', path, query: query);

  Future<Map<String, dynamic>> post(String path, {Object? body}) =>
      _send('POST', path, body: body);

  Future<void> forgetSession() async {
    _cookie = null;
    if (!kIsWeb) await SessionCookieStore.clear();
  }

  Future<void> _ensureCookieLoaded() async {
    if (kIsWeb || _cookieLoaded) return;
    _cookie = await SessionCookieStore.read();
    _cookieLoaded = true;
  }

  Future<Map<String, dynamic>> _send(
    String method,
    String path, {
    Object? body,
    Map<String, dynamic>? query,
  }) async {
    await _ensureCookieLoaded();

    final uri = Uri.parse('$_baseUrl$path').replace(
      queryParameters: query == null
          ? null
          : {
              for (final entry in query.entries)
                if (entry.value != null) entry.key: '${entry.value}',
            },
    );

    final headers = <String, String>{'Content-Type': 'application/json'};
    if (!kIsWeb && _cookie != null) headers['Cookie'] = _cookie!;

    http.Response response;
    try {
      response = switch (method) {
        'GET' => await _client.get(uri, headers: headers),
        'POST' => await _client.post(
            uri,
            headers: headers,
            body: body == null ? null : jsonEncode(body),
          ),
        _ => throw UnsupportedError('Unsupported HTTP method: $method'),
      };
    } on TimeoutException {
      throw const ApiException(
        statusCode: 0,
        code: 'NETWORK_ERROR',
        message: 'The request took too long. Check your connection and try again.',
      );
    } catch (_) {
      throw const ApiException(
        statusCode: 0,
        code: 'NETWORK_ERROR',
        message: 'Could not reach the server. Check your connection and try again.',
      );
    }

    if (!kIsWeb) {
      final setCookie = response.headers['set-cookie'];
      if (setCookie != null && setCookie.isNotEmpty) {
        _cookie = setCookie.split(';').first;
        await SessionCookieStore.write(_cookie!);
      }
    }

    return _decode(response);
  }

  Map<String, dynamic> _decode(http.Response response) {
    Map<String, dynamic> json;
    try {
      final decoded = response.body.isEmpty ? {} : jsonDecode(response.body);
      json = decoded is Map<String, dynamic> ? decoded : <String, dynamic>{};
    } on FormatException {
      throw ApiException(
        statusCode: response.statusCode,
        code: 'INTERNAL_ERROR',
        message: 'Received an unexpected response from the server.',
      );
    }

    if (json['success'] == true) return json;

    final error = json['error'];
    if (error is Map<String, dynamic>) {
      throw ApiException(
        statusCode: (error['statusCode'] as num?)?.toInt() ?? response.statusCode,
        code: error['code'] as String? ?? 'INTERNAL_ERROR',
        message: error['message'] as String? ?? 'Something went wrong. Please try again.',
        details: error['details'],
        requestId: error['requestId'] as String?,
      );
    }

    throw ApiException(
      statusCode: response.statusCode,
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong. Please try again.',
    );
  }
}