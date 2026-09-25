import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../core/api/api_exception.dart';
import '../../core/app_routes.dart';
import '../../core/validators/form_validator.dart';
import '../../shared/widgets/custom_text_field.dart';
import '../../shared/widgets/error_banner.dart';
import '../../shared/widgets/split_layout.dart';
import 'auth_providers.dart';

class ForgotPasswordPage extends HookConsumerWidget {
  const ForgotPasswordPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final formKey = useMemoized(() => GlobalKey<FormState>());
    final emailController = useTextEditingController();
    final isSubmitting = useState(false);
    final errorMessage = useState<String?>(null);

    Future<void> handleSubmit() async {
      if (!formKey.currentState!.validate()) return;
      errorMessage.value = null;
      isSubmitting.value = true;
      try {
        final email = emailController.text.trim();
        await ref.read(authProvider.notifier).forgotPassword(email: email);
        if (context.mounted) context.go(AppRoutes.resetPasswordPath(email));
      } on ApiException catch (e) {

        errorMessage.value = e.message;
      } finally {
        isSubmitting.value = false;
      }
    }

    return SplitLayout(
      bannerHeadline: 'Forgot Your Password?',
      bannerSubtext: "No worries — we'll send a reset code to your email\nso you can get back into your account.",
      child: Form(
        key: formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Reset your password', style: theme.textTheme.headlineLarge),
            const SizedBox(height: 8),
            Text(
              "Enter the email on your account. If it's registered, we'll send a 6-digit code to reset your password.",
              style: theme.textTheme.bodyMedium?.copyWith(color: theme.textTheme.bodySmall?.color, height: 1.6),
            ),
            const SizedBox(height: 32),

            if (errorMessage.value != null) ...[
              InlineErrorBanner(message: errorMessage.value!),
              const SizedBox(height: 20),
            ],

            CustomTextField(
              controller: emailController,
              label: 'Email',
              hintText: 'user@example.com',
              keyboardType: TextInputType.emailAddress,
              validator: FormValidators.validateEmail,
            ),
            const SizedBox(height: 28),

            ElevatedButton(
              onPressed: isSubmitting.value ? null : handleSubmit,
              child: isSubmitting.value
                  ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('Send reset code'),
            ),
            const SizedBox(height: 20),

            Center(
              child: RichText(
                text: TextSpan(
                  text: 'Remembered it? ',
                  style: theme.textTheme.bodyMedium?.copyWith(color: theme.textTheme.bodySmall?.color),
                  children: [
                    TextSpan(
                      text: 'Back to sign in',
                      style: TextStyle(
                        color: theme.primaryColor,
                        fontWeight: FontWeight.bold,
                        decoration: TextDecoration.underline,
                        decorationColor: theme.primaryColor,
                      ),
                      recognizer: TapGestureRecognizer()..onTap = () => context.go(AppRoutes.signIn),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}