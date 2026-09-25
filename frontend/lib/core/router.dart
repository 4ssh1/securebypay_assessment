import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../features/auth/auth_providers.dart';
import '../features/auth/sign_in_page.dart';
import '../features/auth/sign_up_page.dart';
import '../features/dashboard/dashboard_page.dart';
import '../shared/widgets/coming_soon_page.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/signin',
    redirect: (context, state) {
      final isAuth = authState.isAuthenticated;
      final isGoingToAuth = state.matchedLocation == '/signin' || state.matchedLocation == '/signup';

      if (!isAuth && !isGoingToAuth) return '/signin';
      if (isAuth && isGoingToAuth) return '/dashboard';
      return null;
    },
    routes: [
      GoRoute(
        path: '/signin', 
        pageBuilder: (context, state) => const NoTransitionPage(
          child: SignInPage(),
        ),
      ),
      GoRoute(
        path: '/signup', 
        pageBuilder: (context, state) => const NoTransitionPage(
          child: SignUpPage(),
        ),
      ),
      GoRoute(
        path: '/dashboard', 
        builder: (context, state) => const DashboardPage(),
      ),
      GoRoute(
        path: '/coming-soon', 
        builder: (context, state) {
          final title = state.uri.queryParameters['title'] ?? 'Feature';
          return ComingSoonPage(title: title);
        }
      ),
    ],
  );
});