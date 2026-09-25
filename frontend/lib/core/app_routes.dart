class AppRoutes {
  AppRoutes._();

  static const _prefix = '/app';

  static const root = '/';
  static const splash = '$_prefix/splash';
  static const signIn = '$_prefix/signin';
  static const signUp = '$_prefix/signup';
  static const verifyOtp = '$_prefix/verify-otp';
  static const forgotPassword = '$_prefix/forgot-password';
  static const resetPassword = '$_prefix/reset-password';
  static const dashboard = '$_prefix/dashboard';
  static const comingSoon = '$_prefix/coming-soon';

  static String verifyOtpPath(String userId) =>
      '$verifyOtp?userId=${Uri.encodeComponent(userId)}';

  static String resetPasswordPath(String email) =>
      '$resetPassword?email=${Uri.encodeComponent(email)}';

  static String comingSoonPath(String title) =>
      '$comingSoon?title=${Uri.encodeComponent(title)}';
}