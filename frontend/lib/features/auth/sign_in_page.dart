import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'auth_providers.dart';
import '../../core/api/api_exception.dart';
import '../../core/app_routes.dart';
import '../../shared/widgets/split_layout.dart';
import '../../shared/widgets/custom_text_field.dart';
import '../../shared/hooks/use_session_storage.dart';
import '../../core/validators/form_validator.dart';

const _seedPassword = String.fromEnvironment('SEED_PASSWORD');

class _DemoAccount {
  const _DemoAccount({
    required this.role,
    required this.email,
    required this.description,
  });

  final String role;
  final String email;
  final String description;
}

const _demoAccounts = [
  _DemoAccount(
    role: 'Customer',
    email: 'user@securebypay.test',
    description: 'Wallet and personal shipment data',
  ),
  _DemoAccount(
    role: 'Staff',
    email: 'staff@securebypay.test',
    description: 'Company-wide shipment operations',
  ),
  _DemoAccount(
    role: 'Manager',
    email: 'manager@securebypay.test',
    description: 'Shipment analytics and growth reports',
  ),
  _DemoAccount(
    role: 'Admin',
    email: 'admin@securebypay.test',
    description: 'Full analytics and company-wide data',
  ),
];

class SignInPage extends HookConsumerWidget {
  const SignInPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final formKey = useMemoized(() => GlobalKey<FormState>());

    final emailController = useSessionStorage('signin_email');
    final passwordController = useTextEditingController();
    final isPasswordObscured = useState(true);
    final isSubmitting = useState(false);
    final errorMessage = useState<String?>(null);

    Future<void> handleLogin() async {
      if (!formKey.currentState!.validate()) return;
      errorMessage.value = null;
      isSubmitting.value = true;

      try {
        await ref
            .read(authProvider.notifier)
            .login(
              email: emailController.text.trim(),
              password: passwordController.text,
            );
        if (context.mounted) {
          context.go(AppRoutes.dashboard);
        }
      } on ApiException catch (e) {
        if (e.code == 'EMAIL_NOT_VERIFIED' && e.unverifiedUserId != null) {
          if (context.mounted) {
            context.go(AppRoutes.verifyOtpPath(e.unverifiedUserId!));
          }
          return;
        }
        if (e.code == 'ACCOUNT_LOCKED') {
          final minutes = ((e.retryAfterSeconds ?? 60) / 60).ceil();
          errorMessage.value =
              'Too many attempts. Please try again in about $minutes minute${minutes == 1 ? '' : 's'}.';
        } else {
          errorMessage.value = e.message;
        }
      } finally {
        isSubmitting.value = false;
      }
    }

    Future<void> showDemoAccounts() async {
      final account = await showModalBottomSheet<_DemoAccount>(
        context: context,
        showDragHandle: true,
        builder: (sheetContext) => SafeArea(
          child: ListView(
            shrinkWrap: true,
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
            children: [
              Text('Try a demo account', style: theme.textTheme.titleLarge),
              const SizedBox(height: 8),
              Text(
                'Explore how the dashboard changes by role. All seeded accounts use the same password.',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.textTheme.bodySmall?.color,
                ),
              ),
              const SizedBox(height: 16),
              for (final account in _demoAccounts)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: CircleAvatar(
                    backgroundColor: theme.colorScheme.primary.withValues(
                      alpha: 0.1,
                    ),
                    child: Icon(
                      Icons.person_outline,
                      color: theme.colorScheme.primary,
                    ),
                  ),
                  title: Text(account.role),
                  subtitle: Text('${account.email}\n${account.description}'),
                  isThreeLine: true,
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => Navigator.of(sheetContext).pop(account),
                ),
              const SizedBox(height: 8),
              Text(
                _seedPassword.isEmpty
                    ? 'Enter the SEED_PASSWORD configured for the backend after choosing an account.'
                    : 'Password: $_seedPassword',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.textTheme.bodySmall?.color,
                ),
              ),
            ],
          ),
        ),
      );

      if (account == null) return;
      emailController.text = account.email;
      passwordController.text = _seedPassword;
      if (_seedPassword.isEmpty && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Demo email filled. Enter the backend SEED_PASSWORD to continue.',
            ),
          ),
        );
      }
    }

    return SplitLayout(
      bannerHeadline: 'Effortlessly Track Your Shipments\nfrom Nigeria!',
      bannerSubtext:
          'Monitor your shipments from Nigeria! Enjoy swift delivery and\nseamless customs processing',
      child: Form(
        key: formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Sign in to your account',
              style: theme.textTheme.headlineLarge,
            ),
            const SizedBox(height: 8),
            RichText(
              text: TextSpan(
                text:
                    'Log in to Myafrimall to enjoy seamless shipping to over 300\ncountries right from Nigeria.. Don\'t have an account yet? ',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.textTheme.bodySmall?.color,
                  height: 1.6,
                ),
                children: [
                  TextSpan(
                    text: 'Sign Up',
                    style: TextStyle(
                      color: theme.primaryColor,
                      fontWeight: FontWeight.bold,
                      decoration: TextDecoration.underline,
                      decorationColor: theme.primaryColor,
                    ),
                    recognizer: TapGestureRecognizer()
                      ..onTap = () => context.go(AppRoutes.signUp),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),

            if (errorMessage.value != null) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  color: theme.colorScheme.error.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: theme.colorScheme.error.withValues(alpha: 0.3),
                  ),
                ),
                child: Text(
                  errorMessage.value!,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.error,
                  ),
                ),
              ),
              const SizedBox(height: 20),
            ],

            CustomTextField(
              controller: emailController,
              label: 'Email',
              hintText: 'user@example.com',
              keyboardType: TextInputType.emailAddress,
              validator: FormValidators.validateEmail,
            ),
            const SizedBox(height: 20),

            CustomTextField(
              controller: passwordController,
              label: 'Password',
              hintText: 'Enter Password',
              obscureText: isPasswordObscured.value,
              suffixIcon: IconButton(
                icon: Icon(
                  isPasswordObscured.value
                      ? Icons.visibility_off
                      : Icons.visibility,
                  color: theme.textTheme.bodySmall?.color,
                  size: 20,
                ),
                onPressed: () {
                  isPasswordObscured.value = !isPasswordObscured.value;
                },
                splashRadius: 24,
              ),
              validator: FormValidators.validateLoginPassword,
            ),
            const SizedBox(height: 14),

            InkWell(
              onTap: () => context.go(AppRoutes.forgotPassword),
              child: Text(
                'Forgot Password?',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.primaryColor,
                  fontWeight: FontWeight.bold,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
            const SizedBox(height: 8),
            TextButton.icon(
              onPressed: isSubmitting.value ? null : showDemoAccounts,
              icon: const Icon(Icons.explore_outlined, size: 18),
              label: const Text('Try a demo account'),
              style: TextButton.styleFrom(padding: EdgeInsets.zero),
            ),
            const SizedBox(height: 28),

            ElevatedButton(
              onPressed: isSubmitting.value ? null : handleLogin,
              child: isSubmitting.value
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : const Text('Login'),
            ),
            const SizedBox(height: 32),

            RichText(
              text: TextSpan(
                text: 'By clicking on create account you agree to our ',
                style: theme.textTheme.bodySmall,
                children: [
                  TextSpan(
                    text: 'privacy\npolicy',
                    style: TextStyle(
                      color: theme.primaryColor,
                      fontWeight: FontWeight.bold,
                      decoration: TextDecoration.underline,
                      decorationColor: theme.primaryColor,
                    ),
                    recognizer: TapGestureRecognizer()..onTap = () {},
                  ),
                  const TextSpan(text: ' and '),
                  TextSpan(
                    text: 'terms of use',
                    style: TextStyle(
                      color: theme.primaryColor,
                      fontWeight: FontWeight.bold,
                      decoration: TextDecoration.underline,
                      decorationColor: theme.primaryColor,
                    ),
                    recognizer: TapGestureRecognizer()..onTap = () {},
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
