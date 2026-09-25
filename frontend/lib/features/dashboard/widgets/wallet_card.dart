import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/responsive.dart';
import '../../../utils/format.dart';

class WalletCard extends StatelessWidget {
  final String balance;
  final VoidCallback? onFundPressed;

  const WalletCard({super.key, required this.balance, this.onFundPressed});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(color: theme.primaryColor, borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Your Balance', style: theme.textTheme.bodyMedium?.copyWith(color: Colors.white70)),
          const SizedBox(height: 8),
          Text(

            formatNaira(balance),
            style: GoogleFonts.dmSans(
              fontWeight: FontWeight.w700,
              color: Colors.white,
              fontSize: Responsive.font(context, min: 20, max: 26),
            ),
          ),
          const SizedBox(height: 14),
          ElevatedButton(
            onPressed: onFundPressed,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: theme.primaryColor,
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 18),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('Fund Wallet'),
          ),
        ],
      ),
    );
  }
}