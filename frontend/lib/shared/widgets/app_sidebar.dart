import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme.dart';
import '../../features/auth/auth_providers.dart';
import 'avatar.dart';

// TODO: replace with real user data once the backend/auth provider exposes it.
const _mockFirstName = 'Adaeze';
const _mockLastName = 'Okafor';
const String? _mockAvatarUrl = null; 

class AppSidebar extends HookConsumerWidget {
  final String activeRoute;

  const AppSidebar({super.key, required this.activeRoute});

  static const List<(String, IconData)> _items = [
    ('Dashboard', Icons.dashboard_outlined),
    ('Shipments', Icons.local_shipping_outlined),
    ('Our Services', Icons.language_outlined),
    ('Notifications', Icons.notifications_outlined),
    ('Wallet', Icons.account_balance_wallet_outlined),
    ('My Addresses', Icons.location_on_outlined),
    ('Invite & Earn', Icons.monetization_on_outlined),
    ('Help Center', Icons.help_outline),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      width: 250,
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 32),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(vertical: 8),
              children: _items.map((item) => _buildItem(context, item.$1, item.$2)).toList(),
            ),
          ),
          const Divider(height: 1, color: AppColors.border),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                const UserAvatar(
                  firstName: _mockFirstName,
                  lastName: _mockLastName,
                  avatarUrl: _mockAvatarUrl,
                  size: 34,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        _mockFirstName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.dmSans(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      Text(
                        _mockLastName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.dmSans(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                Material(
                  color: Colors.transparent,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(10),
                    onTap: () => ref.read(authProvider.notifier).logout(),
                    child: const Padding(
                      padding: EdgeInsets.all(6),
                      child: Icon(Icons.logout, size: 19, color: AppColors.textSecondary),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildItem(BuildContext context, String title, IconData icon) {
    final isSelected = activeRoute == title;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Material(
        color: isSelected ? AppColors.darkNavy : Colors.transparent,
        borderRadius: BorderRadius.circular(10),
        child: InkWell(
          borderRadius: BorderRadius.circular(10),
          onTap: () {
            if (Scaffold.of(context).isDrawerOpen) Navigator.pop(context);

            if (title == 'Dashboard') {
              context.go('/dashboard');
            } else {
              context.push('/coming-soon?title=$title');
            }
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Row(
              children: [
                Icon(icon, size: 19, color: isSelected ? Colors.white : AppColors.textSecondary),
                const SizedBox(width: 12),
                Text(
                  title,
                  style: GoogleFonts.dmSans(
                    fontSize: 13.5,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                    color: isSelected ? Colors.white : AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}