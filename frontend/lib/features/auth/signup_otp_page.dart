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
import '../../shared/widgets/split_layout.dart';
import 'auth_providers.dart';

class SignupOtpPage extends HookConsumerWidget {
  const SignupOtpPage({super.key, required this.userId});

  final String userId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    if (userId.isEmpty) {
      return SplitLayout(
        child: _MissingUserIdNotice(theme: theme),
      );
    }

    final formKey = useMemoized(() => GlobalKey<FormState>());
    final codeController = useTextEditingController();
    final isSubmitting = useState(false);
    final isResending = useState(false);
    final errorMessage = useState<String?>(null);
    final cooldownSeconds = useState(0);

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

    Future<void> handleVerify() async {
      if (!formKey.currentState!.validate()) return;
      errorMessage.value = null;
      isSubmitting.value = true;
      try {
        await ref.read(authProvider.notifier).verifySignupOtp(
              userId: userId,
              code: codeController.text.trim(),
            );
        if (context.mounted) context.go(AppRoutes.dashboard);
      } on ApiException catch (e) {
        errorMessage.value = e.message;
      } finally {
        isSubmitting.value = false;
      }
    }

    Future<void> handleResend() async {
      errorMessage.value = null;
      isResending.value = true;
      try {
        await ref.read(authProvider.notifier).resendOtp(userId: userId);
        cooldownSeconds.value = 60;
      } on ApiException catch (e) {
        if (e.code == 'OTP_COOLDOWN' && e.retryAfterSeconds != null) {
          cooldownSeconds.value = e.retryAfterSeconds!;
        } else {
          errorMessage.value = e.message;
        }
      } finally {
        isResending.value = false;
      }
    }

    return SplitLayout(
      bannerHeadline: 'Almost There!',
      bannerSubtext: 'One more step and your Myafrimall account is ready to go.',
      child: Form(
        key: formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Verify your email', style: theme.textTheme.headlineLarge),
            const SizedBox(height: 8),
            Text(
              'We sent a 6-digit code to the email you signed up with. Enter it below — it expires in 10 minutes.',
              style: theme.textTheme.bodyMedium?.copyWith(color: theme.textTheme.bodySmall?.color, height: 1.6),
            ),
            const SizedBox(height: 32),

            if (errorMessage.value != null) ...[
              _ErrorBanner(message: errorMessage.value!, theme: theme),
              const SizedBox(height: 20),
            ],

            CustomTextField(
              controller: codeController,
              label: 'Verification code',
              hintText: '000000',
              keyboardType: TextInputType.number,
              validator: FormValidators.validateOtpCode,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                LengthLimitingTextInputFormatter(6),
              ],
              textStyle: theme.textTheme.headlineLarge?.copyWith(letterSpacing: 8),
            ),
            const SizedBox(height: 24),

            ElevatedButton(
              onPressed: isSubmitting.value ? null : handleVerify,
              child: isSubmitting.value
                  ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('Verify & continue'),
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

class _MissingUserIdNotice extends StatelessWidget {
  const _MissingUserIdNotice({required this.theme});

  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Verification link incomplete', style: theme.textTheme.headlineLarge),
        const SizedBox(height: 8),
        Text(
          "We couldn't tell which account to verify. Please sign up again or sign in — if your email is already verified, signing in works right away.",
          style: theme.textTheme.bodyMedium?.copyWith(color: theme.textTheme.bodySmall?.color, height: 1.6),
        ),
        const SizedBox(height: 24),
        ElevatedButton(
          onPressed: () => context.go(AppRoutes.signUp),
          child: const Text('Back to sign up'),
        ),
      ],
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message, required this.theme});

  final String message;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: theme.colorScheme.error.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: theme.colorScheme.error.withValues(alpha: 0.3)),
      ),
      child: Text(message, style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.error)),
    );
  }
}