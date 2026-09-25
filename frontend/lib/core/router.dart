import 'package:flutter/widgets.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import 'app_routes.dart';
import '../features/auth/auth_providers.dart';
import '../features/auth/forgot_password_page.dart';
import '../features/auth/reset_password_page.dart';
import '../features/auth/sign_in_page.dart';
import '../features/auth/sign_up_page.dart';
import '../features/auth/signup_otp_page.dart';
import '../features/auth/splash_page.dart';
import '../features/dashboard/dashboard_page.dart';
import '../shared/widgets/coming_soon_page.dart';

const _authRoutes = {
  AppRoutes.signIn,
  AppRoutes.signUp,
  AppRoutes.verifyOtp,
  AppRoutes.forgotPassword,
  AppRoutes.resetPassword,
};

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);
  final bootstrap = ref.watch(sessionBootstrapProvider);

  return GoRouter(
    initialLocation: AppRoutes.splash,
    redirect: (context, state) {
      final path = state.matchedLocation;
      final isSplash = path == AppRoutes.splash;

      if (bootstrap.isLoading) return isSplash ? null : AppRoutes.splash;

      final isAuth = authState.isAuthenticated;

      if (isSplash || path == AppRoutes.root) {
        return isAuth ? AppRoutes.dashboard : AppRoutes.signIn;
      }

      final isAuthRoute = _authRoutes.contains(path);
      if (!isAuth && !isAuthRoute) return AppRoutes.signIn;
      if (isAuth && isAuthRoute) return AppRoutes.dashboard;
      return null;
    },
    routes: [
      GoRoute(
        path: AppRoutes.root,

        builder: (context, state) => const SizedBox.shrink(),
      ),
      GoRoute(
        path: AppRoutes.splash,
        builder: (context, state) => const SplashPage(),
      ),
      GoRoute(
        path: AppRoutes.signIn,
        pageBuilder: (context, state) => const NoTransitionPage(
          child: SignInPage(),
        ),
      ),
      GoRoute(
        path: AppRoutes.signUp,
        pageBuilder: (context, state) => const NoTransitionPage(
          child: SignUpPage(),
        ),
      ),
      GoRoute(
        path: AppRoutes.verifyOtp,
        pageBuilder: (context, state) => NoTransitionPage(
          child: SignupOtpPage(userId: state.uri.queryParameters['userId'] ?? ''),
        ),
      ),
      GoRoute(
        path: AppRoutes.forgotPassword,
        pageBuilder: (context, state) => const NoTransitionPage(
          child: ForgotPasswordPage(),
        ),
      ),
      GoRoute(
        path: AppRoutes.resetPassword,
        pageBuilder: (context, state) => NoTransitionPage(
          child: ResetPasswordPage(email: state.uri.queryParameters['email'] ?? ''),
        ),
      ),
      GoRoute(
        path: AppRoutes.dashboard,
        builder: (context, state) => const DashboardPage(),
      ),
      GoRoute(
        path: AppRoutes.comingSoon,
        builder: (context, state) {
          final title = state.uri.queryParameters['title'] ?? 'Feature';
          return ComingSoonPage(title: title);
        },
      ),
    ],
  );
});