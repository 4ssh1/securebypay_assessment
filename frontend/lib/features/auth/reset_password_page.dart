import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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

class ResetPasswordPage extends HookConsumerWidget {
  const ResetPasswordPage({super.key, required this.email});

  final String email;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    if (email.isEmpty) {
      return SplitLayout(child: _MissingEmailNotice(theme: theme));
    }

    final formKey = useMemoized(() => GlobalKey<FormState>());
    final codeController = useTextEditingController();
    final newPasswordController = useTextEditingController();
    final confirmPasswordController = useTextEditingController();
    final isPasswordObscured = useState(true);
    final isSubmitting = useState(false);
    final isResending = useState(false);
    final errorMessage = useState<String?>(null);
    final infoMessage = useState<String?>(null);

    final cooldownSeconds = useState(60);

    useEffect(() {
      if (cooldownSeconds.value <= 0) return null;
      final timer = Timer.periodic(const Duration(seconds: 1), (t) {
        if (cooldownSeconds.value <= 1) {
          cooldownSeconds.value = 0;
          t.cancel();
        } else {
          cooldownSeconds.value -= 1;
        }
      });
      return timer.cancel;
    }, [cooldownSeconds.value > 0]);

    Future<void> handleReset() async {
      if (!formKey.currentState!.validate()) return;
      errorMessage.value = null;
      infoMessage.value = null;
      isSubmitting.value = true;
      try {
        await ref.read(authProvider.notifier).resetPassword(
              email: email,
              code: codeController.text.trim(),
              newPassword: newPasswordController.text,
            );
        if (context.mounted) context.go(AppRoutes.signIn);
      } on ApiException catch (e) {
        errorMessage.value = e.code == 'OTP_INVALID' ? 'That code is invalid or has expired.' : e.message;
      } finally {
        isSubmitting.value = false;
      }
    }

    Future<void> handleResend() async {
      errorMessage.value = null;
      infoMessage.value = null;
      isResending.value = true;
      try {
        await ref.read(authProvider.notifier).forgotPassword(email: email);
        cooldownSeconds.value = 60;
        infoMessage.value = 'If this email is registered, a new code is on its way.';
      } on ApiException catch (e) {
        errorMessage.value = e.message;
      } finally {
        isResending.value = false;
      }
    }

    return SplitLayout(
      bannerHeadline: 'Reset Your Password',
      bannerSubtext: 'Enter the code we sent and choose a new\npassword to get back into your account.',
      child: Form(
        key: formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Enter code & new password', style: theme.textTheme.headlineLarge),
            const SizedBox(height: 8),
            Text(
              'We sent a 6-digit code to $email. It expires in 10 minutes.',
              style: theme.textTheme.bodyMedium?.copyWith(color: theme.textTheme.bodySmall?.color, height: 1.6),
            ),
            const SizedBox(height: 32),

            if (errorMessage.value != null) ...[
              InlineErrorBanner(message: errorMessage.value!),
              const SizedBox(height: 20),
            ],
            if (infoMessage.value != null) ...[
              Text(infoMessage.value!, style: theme.textTheme.bodyMedium?.copyWith(color: theme.primaryColor)),
              const SizedBox(height: 20),
            ],

            CustomTextField(
              controller: codeController,
              label: 'Reset code',
              hintText: '000000',
              keyboardType: TextInputType.number,
              validator: FormValidators.validateOtpCode,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                LengthLimitingTextInputFormatter(6),
              ],
              textStyle: theme.textTheme.headlineLarge?.copyWith(letterSpacing: 8),
            ),
            const SizedBox(height: 20),

            CustomTextField(
              controller: newPasswordController,
              label: 'New password',
              hintText: 'At least 10 characters, with upper, lower & a number',
              obscureText: isPasswordObscured.value,
              suffixIcon: IconButton(
                icon: Icon(
                  isPasswordObscured.value ? Icons.visibility_off : Icons.visibility,
                  color: theme.textTheme.bodySmall?.color,
                  size: 20,
                ),
                onPressed: () => isPasswordObscured.value = !isPasswordObscured.value,
                splashRadius: 24,
              ),
              validator: FormValidators.validatePassword,
            ),
            const SizedBox(height: 20),

            CustomTextField(
              controller: confirmPasswordController,
              label: 'Confirm new password',
              hintText: 'Re-enter your new password',
              obscureText: isPasswordObscured.value,
              validator: (value) => FormValidators.validatePasswordConfirmation(value, newPasswordController.text),
            ),
            const SizedBox(height: 28),

            ElevatedButton(
              onPressed: isSubmitting.value ? null : handleReset,
              child: isSubmitting.value
                  ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('Reset password'),
            ),
            const SizedBox(height: 20),

            Center(
              child: TextButton(
                onPressed: (cooldownSeconds.value > 0 || isResending.value) ? null : handleResend,
                child: Text(
                  cooldownSeconds.value > 0
                      ? "Didn't get it? Resend in ${cooldownSeconds.value}s"
                      : (isResending.value ? 'Sending…' : "Didn't get it? Resend code"),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MissingEmailNotice extends StatelessWidget {
  const _MissingEmailNotice({required this.theme});

  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Reset link incomplete', style: theme.textTheme.headlineLarge),
        const SizedBox(height: 8),
        Text(
          "We couldn't tell which account to reset. Please request a new reset code.",
          style: theme.textTheme.bodyMedium?.copyWith(color: theme.textTheme.bodySmall?.color, height: 1.6),
        ),
        const SizedBox(height: 24),
        ElevatedButton(
          onPressed: () => context.go(AppRoutes.forgotPassword),
          child: const Text('Back to forgot password'),
        ),
      ],
    );
  }
}