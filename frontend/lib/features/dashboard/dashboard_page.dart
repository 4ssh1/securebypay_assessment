import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dashboard_providers.dart';
import 'widgets/metric_card.dart';
import 'widgets/wallet_card.dart';
import 'widgets/growth_chart.dart';
import 'widgets/recent_shipment_card.dart';
import 'widgets/fund_wallet_dialog.dart';
import '../../core/models/dashboard.dart';
import '../../core/models/shipment.dart';
import '../../core/theme.dart';
import '../../core/responsive.dart';
import '../../shared/widgets/app_sidebar.dart';
import '../../utils/format.dart';

class DashboardPage extends HookConsumerWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isDesktop = Responsive.isDesktop(context);
    final contentPadding = Responsive.isMobile(context) ? 16.0 : 32.0;

    final selectedPeriod = useState(DashboardPeriod.thisMonth);
    final overviewAsync = ref.watch(dashboardProvider(selectedPeriod.value));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: isDesktop
          ? null
          : AppBar(
              backgroundColor: Colors.white,
              elevation: 0,
              iconTheme: IconThemeData(color: theme.primaryColor),
              title: Text(
                'Dashboard',
                style: GoogleFonts.dmSans(
                  color: theme.primaryColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ),
      drawer: isDesktop ? null : const Drawer(child: AppSidebar(activeRoute: 'Dashboard')),
      body: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (isDesktop) const AppSidebar(activeRoute: 'Dashboard'),
          Expanded(
            child: overviewAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, stack) => Center(child: Text('Error: $err')),
              data: (overview) => ListView(
                padding: EdgeInsets.all(contentPadding),
                children: [
                  Text('Invite & Earn', style: theme.textTheme.titleLarge),
                  const SizedBox(height: 4),
                  Text(
                    'Keep track of your addresses, location updates. Edit, Delete, Update and see all\nyour saved addresses',
                    style: theme.textTheme.bodySmall?.copyWith(height: 1.6),
                  ),
                  const SizedBox(height: 20),

                  ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: AspectRatio(
                      aspectRatio: 3423 / 735, 
                      child: Image.asset(
                        'assets/images/bg.png',
                        width: double.infinity,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),

                  const SizedBox(height: 32),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Overview', style: theme.textTheme.titleMedium),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<DashboardPeriod>(
                            value: selectedPeriod.value,
                            icon: const Padding(
                              padding: EdgeInsets.only(left: 6.0),
                              child: Icon(Icons.keyboard_arrow_down, size: 16, color: AppColors.textSecondary),
                            ),
                            isDense: true,
                            style: theme.textTheme.bodyMedium,
                            dropdownColor: Colors.white,
                            borderRadius: BorderRadius.circular(8),
                            onChanged: (value) {
                              if (value != null) selectedPeriod.value = value;
                            },
                            items: DashboardPeriod.values
                                .map((p) => DropdownMenuItem(value: p, child: Text(p.label)))
                                .toList(),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  _MetricsRow(overview: overview, isDesktop: isDesktop),

                  const SizedBox(height: 32),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Recent shipment', style: theme.textTheme.titleMedium),
                      OutlinedButton(onPressed: () {}, child: const Text('See All')),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // manager/admin only — see sections.growthChart in the guide.
                  if (overview.sections.growthChart) ...[
                    const GrowthChart(),
                    const SizedBox(height: 16),
                  ],

                  if (overview.sections.recentShipments)
                    for (final shipment in overview.recentShipments) ...[
                      _RecentShipmentTile(shipment: shipment, canPay: overview.sections.wallet),
                      const SizedBox(height: 12),
                    ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MetricsRow extends StatelessWidget {
  const _MetricsRow({required this.overview, required this.isDesktop});

  final DashboardOverview overview;
  final bool isDesktop;

  Future<void> _handleFundWallet(BuildContext context) async {
    final funded = await showFundWalletDialog(context);
    if (funded == true && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Wallet funded successfully.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final walletCard = (overview.sections.wallet && overview.wallet != null)
        ? WalletCard(
            balance: overview.wallet!.balance,
            onFundPressed: () => _handleFundWallet(context),
          )
        : null;

    final metricCards = [
      MetricCard(
        title: 'Total Shipment',
        value: overview.totalShipments.count,
        changePercent: overview.totalShipments.changePercent,
        previousCount: overview.totalShipments.previousCount,
        icon: Icons.local_shipping,
        iconColor: AppColors.warning,
        iconBackgroundColor: AppColors.warning.withValues(alpha: 0.12),
      ),
      MetricCard(
        title: 'Total Exports',
        value: overview.totalExports.count,
        changePercent: overview.totalExports.changePercent,
        previousCount: overview.totalExports.previousCount,
        icon: Icons.arrow_upward,
        iconColor: AppColors.success,
        iconBackgroundColor: AppColors.success.withValues(alpha: 0.12),
      ),
      MetricCard(
        title: 'Total Import',
        value: overview.totalImports.count,
        changePercent: overview.totalImports.changePercent,
        previousCount: overview.totalImports.previousCount,
        icon: Icons.arrow_downward,
        iconColor: AppColors.info,
        iconBackgroundColor: AppColors.info.withValues(alpha: 0.12),
      ),
    ];

    final cards = [?walletCard, ...metricCards];

    if (!isDesktop) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [for (final c in cards) ...[c, const SizedBox(height: 12)]],
      );
    }

    return Row(
      children: [
        for (var i = 0; i < cards.length; i++) ...[
          Expanded(flex: cards[i] == walletCard ? 2 : 1, child: cards[i]),
          if (i != cards.length - 1) const SizedBox(width: 16),
        ],
      ],
    );
  }
}

class _RecentShipmentTile extends StatelessWidget {
  const _RecentShipmentTile({required this.shipment, required this.canPay});

  final Shipment shipment;
  final bool canPay;

  @override
  Widget build(BuildContext context) {
    return RecentShipmentCard(
      trackingId: shipment.trackingId,
      sender: shipment.sender.name,
      receiver: shipment.receiver.name,
      pickUpLocation: shipment.route.pickUp,
      deliveryLocation: shipment.route.delivery,
      amount: formatNaira(shipment.amount),
      status: shipment.status.label,
      processingTime: formatProcessingTime(shipment.processingTimeHours),
      isPaid: shipment.paymentStatus == PaymentStatus.paid,
      showPayment: canPay,
    );
  }
}