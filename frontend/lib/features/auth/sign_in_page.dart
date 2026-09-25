import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'auth_providers.dart';
import '../../shared/widgets/split_layout.dart';
import '../../shared/widgets/custom_text_field.dart';
import '../../shared/hooks/use_session_storage.dart';
import '../../core/validators/form_validator.dart';

class SignInPage extends HookConsumerWidget {
  const SignInPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final formKey = useMemoized(() => GlobalKey<FormState>());

    final emailController = useSessionStorage('signin_email');
    final passwordController = useTextEditingController();
    final isPasswordObscured = useState(true);

    final authState = ref.watch(authProvider);

    void handleLogin() {
      if (formKey.currentState!.validate()) {
        ref.read(authProvider.notifier).login(
          emailController.text,
          passwordController.text,
        );
      }
    }

    return SplitLayout(
      bannerHeadline: 'Effortlessly Track Your Shipments\nfrom Nigeria!',
      bannerSubtext: 'Monitor your shipments from Nigeria! Enjoy swift delivery and\nseamless customs processing',
      child: Form(
        key: formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Sign in to your account', style: theme.textTheme.headlineLarge),
            const SizedBox(height: 8),
            RichText(
              text: TextSpan(
                text: 'Log in to Myafrimall to enjoy seamless shipping to over 300\ncountries right from Nigeria.. Don\'t have an account yet? ',
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
                    recognizer: TapGestureRecognizer()..onTap = () => context.go('/signup'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),

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
                  isPasswordObscured.value ? Icons.visibility_off : Icons.visibility,
                  color: theme.textTheme.bodySmall?.color, 
                  size: 20,
                ),
                onPressed: () {
                  isPasswordObscured.value = !isPasswordObscured.value;
                },
                splashRadius: 24,
              ),
              validator: FormValidators.validatePassword,
            ),
            const SizedBox(height: 14),

            InkWell(
              onTap: () {},
              child: Text(
                'Forgot Password?',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.primaryColor,
                  fontWeight: FontWeight.bold,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
            const SizedBox(height: 28),

            ElevatedButton(
              onPressed: authState.isLoading ? null : handleLogin,
              child: authState.isLoading
                  ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
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