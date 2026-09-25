import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../../core/api/api_exception.dart';
import '../../../core/api/api_provider.dart';
import '../../../core/validators/form_validator.dart';
import '../../../shared/widgets/custom_text_field.dart';
import '../../../shared/widgets/error_banner.dart';
import '../../../utils/idempotency.dart';
import '../dashboard_providers.dart';

Future<bool?> showFundWalletDialog(BuildContext context) {
  return showDialog<bool>(
    context: context,
    builder: (_) => const _FundWalletDialog(),
  );
}

class _FundWalletDialog extends HookConsumerWidget {
  const _FundWalletDialog();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final formKey = useMemoized(() => GlobalKey<FormState>());
    final amountController = useTextEditingController();
    final isSubmitting = useState(false);
    final errorMessage = useState<String?>(null);

    final reference = useState(generateFundingReference());

    Future<void> handleSubmit() async {
      if (!formKey.currentState!.validate()) return;
      errorMessage.value = null;
      isSubmitting.value = true;
      try {
        final api = ref.read(apiClientProvider);
        await api.post('/wallet/fund', body: {
          'amount': amountController.text.trim(),
          'reference': reference.value,
        });

        ref.invalidate(dashboardProvider);
        if (context.mounted) Navigator.of(context).pop(true);
      } on ApiException catch (e) {
        if (e.isNetworkError) {
          errorMessage.value = '${e.message} Tap Fund again — the same request will not be charged twice.';
        } else if (e.code == 'DUPLICATE_REFERENCE') {
          reference.value = generateFundingReference();
          errorMessage.value = 'That request could not be matched to this amount. Please try again.';
        } else if (e.code == 'VALIDATION_FAILED' && e.validationMessages.isNotEmpty) {
          errorMessage.value = e.validationMessages.first;
        } else {
          errorMessage.value = e.message;
        }
      } finally {
        isSubmitting.value = false;
      }
    }

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 380),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Fund Wallet', style: theme.textTheme.titleLarge),
                const SizedBox(height: 6),
                Text(
                  'Enter an amount between \u20a6100.00 and \u20a65,000,000.00.',
                  style: theme.textTheme.bodySmall,
                ),
                const SizedBox(height: 20),

                if (errorMessage.value != null) ...[
                  InlineErrorBanner(message: errorMessage.value!),
                  const SizedBox(height: 16),
                ],

                CustomTextField(
                  controller: amountController,
                  label: 'Amount (NGN)',
                  hintText: '2500.00',
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  validator: FormValidators.validateFundingAmount,
                ),
                const SizedBox(height: 24),

                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: isSubmitting.value ? null : () => Navigator.of(context).pop(false),
                      child: const Text('Cancel'),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: isSubmitting.value ? null : handleSubmit,
                      child: isSubmitting.value
                          ? const SizedBox(
                              height: 18,
                              width: 18,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : const Text('Fund'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}