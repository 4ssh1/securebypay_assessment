import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../core/models/auth_user.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_exception.dart';
import '../../core/api/api_provider.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthState {
  AuthState({this.status = AuthStatus.unknown, this.user});

  final AuthStatus status;
  final AuthUser? user;

  bool get isAuthenticated => status == AuthStatus.authenticated;

  AuthState copyWith({AuthStatus? status, AuthUser? user, bool clearUser = false}) {
    return AuthState(
      status: status ?? this.status,
      user: clearUser ? null : (user ?? this.user),
    );
  }
}

class AuthNotifier extends Notifier<AuthState> {
  late final ApiClient _api = ref.read(apiClientProvider);

  @override
  AuthState build() => AuthState();

  Future<void> bootstrap() async {
    try {
      final response = await _api.get('/auth/me');
      final user = AuthUser.fromJson(response['data'] as Map<String, dynamic>);
      state = state.copyWith(status: AuthStatus.authenticated, user: user);
    } on ApiException {
      state = state.copyWith(status: AuthStatus.unauthenticated, clearUser: true);
    }
  }

  Future<String> signup({
    required String firstName,
    required String lastName,
    required String email,
    required String phone,
    required String password,
  }) async {
    final response = await _api.post('/auth/signup', body: {
      'firstName': firstName,
      'lastName': lastName,
      'email': email,
      'phone': phone,
      'password': password,
    });
    return (response['data'] as Map<String, dynamic>)['userId'] as String;
  }

  Future<void> verifySignupOtp({required String userId, required String code}) async {
    final response = await _api.post('/auth/verify-signup-otp', body: {
      'userId': userId,
      'code': code,
    });
    final user = AuthUser.fromJson(response['data'] as Map<String, dynamic>);
    state = state.copyWith(status: AuthStatus.authenticated, user: user);
  }

  Future<void> resendOtp({required String userId}) {
    return _api.post('/auth/resend-otp', body: {'userId': userId});
  }

  Future<void> forgotPassword({required String email}) {
    return _api.post('/auth/forgot-password', body: {'email': email});
  }

  Future<void> resetPassword({
    required String email,
    required String code,
    required String newPassword,
  }) {
    return _api.post('/auth/reset-password', body: {
      'email': email,
      'code': code,
      'newPassword': newPassword,
    });
  }

  Future<void> login({required String email, required String password}) async {
    final response = await _api.post('/auth/login', body: {'email': email, 'password': password});
    final user = AuthUser.fromJson(response['data'] as Map<String, dynamic>);
    state = state.copyWith(status: AuthStatus.authenticated, user: user);
  }

  Future<void> logout() async {
    try {
      await _api.post('/auth/logout');
    } on ApiException {
      // Ignore API exceptions during logout
    } finally {
      await _api.forgetSession();
      state = state.copyWith(status: AuthStatus.unauthenticated, clearUser: true);
    }
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);

final sessionBootstrapProvider = FutureProvider<void>((ref) {
  return ref.read(authProvider.notifier).bootstrap();
});