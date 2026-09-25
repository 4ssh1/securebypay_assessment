import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SessionCookieStore {
  SessionCookieStore._();

  static const _cookieKey = 'securebypay_session_cookie';
  
  static const _storage = FlutterSecureStorage();

  static Future<String?> read() async {
    return await _storage.read(key: _cookieKey);
  }

  static Future<void> write(String cookie) async {
    await _storage.write(key: _cookieKey, value: cookie);
  }

  static Future<void> clear() async {
    await _storage.delete(key: _cookieKey);
  }
}