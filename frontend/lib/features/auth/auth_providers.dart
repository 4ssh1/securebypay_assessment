import 'package:hooks_riverpod/hooks_riverpod.dart';

class AuthState {
  final bool isAuthenticated;
  final bool isLoading;
  final String? errorMessage;

  AuthState({
    this.isAuthenticated = false, 
    this.isLoading = false,
    this.errorMessage,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    bool? isLoading,
    String? errorMessage,
    bool clearError = false, 
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

class AuthNotifier extends Notifier<AuthState> {
  
  @override
  AuthState build() {
    return AuthState(); // Defines the initial state
  }

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      // TODO: Replace with Dio POST request to your NestJS backend
      await Future.delayed(const Duration(seconds: 1)); 
      
      if (email.isEmpty || password.isEmpty) {
        throw Exception('Email and password cannot be empty');
      }

      state = state.copyWith(isAuthenticated: true, isLoading: false);
      
    } catch (e) {
      state = state.copyWith(
        isLoading: false, 
        isAuthenticated: false,
        errorMessage: 'Login failed: ${e.toString().replaceAll('Exception: ', '')}',
      );
    }
  }
  
  void logout() {
    state = AuthState(); 
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(() {
  return AuthNotifier();
});