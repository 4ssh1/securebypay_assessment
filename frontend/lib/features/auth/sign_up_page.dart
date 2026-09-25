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

class SignUpPage extends HookConsumerWidget {
  const SignUpPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final formKey = useMemoized(() => GlobalKey<FormState>());

    final firstNameController = useSessionStorage('signup_firstname');
    final lastNameController = useSessionStorage('signup_lastname');
    final emailController = useSessionStorage('signup_email');
    final phoneController = useSessionStorage('signup_phone');
    final passwordController = useTextEditingController();
    final isPasswordObscured = useState(true);

    final authState = ref.watch(authProvider);

    void handleSignUp() {
      if (formKey.currentState!.validate()) {
        ref.read(authProvider.notifier).login(
          emailController.text,
          passwordController.text,
        );
      }
    }

    return SplitLayout(
      child: Form(
        key: formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Create an account', style: theme.textTheme.headlineLarge),
              const SizedBox(height: 8),

              RichText(
                text: TextSpan(
                  text: 'Sign up for Myafrimall and gain unlimited access to shipping to over 300 countries from Nigeria. Do you already have an account? ',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.textTheme.bodySmall?.color,
                    height: 1.6,
                  ),
                  children: [
                    TextSpan(
                      text: 'Login',
                      style: TextStyle(
                        color: theme.primaryColor, 
                        fontWeight: FontWeight.bold,
                        decoration: TextDecoration.underline,
                        decorationColor: theme.primaryColor,
                      ),
                      recognizer: TapGestureRecognizer()..onTap = () => context.go('/signin'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: CustomTextField(
                      controller: firstNameController,
                      label: 'First name',
                      hintText: 'John',
                      validator: (value) => FormValidators.validateRequired(value, 'First name'),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: CustomTextField(
                      controller: lastNameController,
                      label: 'Last name',
                      hintText: 'Doe',
                      validator: (value) => FormValidators.validateRequired(value, 'Last name'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              CustomTextField(
                controller: emailController,
                label: 'Email',
                hintText: 'user@example.com',
                keyboardType: TextInputType.emailAddress,
                validator: FormValidators.validateEmail,
              ),
              const SizedBox(height: 20),

              CustomTextField(
                controller: phoneController,
                label: 'Phone Number',
                hintText: '8012345678',
                keyboardType: TextInputType.phone,
                prefixIcon: Padding(
                  padding: const EdgeInsets.only(left: 14.0, right: 8.0),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('+234', style: theme.textTheme.bodyMedium?.copyWith(color: theme.textTheme.bodySmall?.color)),
                      const SizedBox(width: 4),
                      Icon(Icons.keyboard_arrow_down, size: 16, color: theme.textTheme.bodySmall?.color),
                      const SizedBox(width: 8),
                      Container(width: 1, height: 18, color: theme.dividerTheme.color),
                    ],
                  ),
                ),
                validator: FormValidators.validatePhone,
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
              const SizedBox(height: 28),

              ElevatedButton(
                onPressed: authState.isLoading ? null : handleSignUp,
                child: authState.isLoading
                    ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Create account'),
              ),
              const SizedBox(height: 20),

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
      ),
    );
  }
}