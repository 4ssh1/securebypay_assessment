import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'dashboard_providers.dart';
import 'widgets/metric_card.dart';
import 'widgets/wallet_card.dart';
import 'widgets/growth_chart.dart';
import 'widgets/recent_shipment_card.dart';
import '../../core/theme.dart';
import '../../core/responsive.dart';
import '../../shared/widgets/app_sidebar.dart';

class DashboardPage extends HookConsumerWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final metricsAsync = ref.watch(metricsProvider);
    final theme = Theme.of(context);
    final isDesktop = Responsive.isDesktop(context);
    final contentPadding = Responsive.isMobile(context) ? 16.0 : 32.0;

    final selectedFilter = useState('Month');
    final filterOptions = ['Year', 'Month', 'Week'];

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
            child: metricsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, stack) => Center(child: Text('Error: $err')),
              data: (metrics) => ListView(
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
                    child: SvgPicture.asset(
                      'assets/images/bg.svg',
                      height: isDesktop ? 180 : 140,
                      width: double.infinity,
                      fit: BoxFit.cover,
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
                          child: DropdownButton<String>(
                            value: selectedFilter.value,
                            icon: const Padding(
                              padding: EdgeInsets.only(left: 6.0),
                              child: Icon(Icons.keyboard_arrow_down, size: 16, color: AppColors.textSecondary),
                            ),
                            isDense: true,
                            style: theme.textTheme.bodyMedium,
                            dropdownColor: Colors.white,
                            borderRadius: BorderRadius.circular(8),
                            onChanged: (String? newValue) {
                              if (newValue != null) {
                                selectedFilter.value = newValue;
                              }
                            },
                            items: filterOptions.map<DropdownMenuItem<String>>((String value) {
                              return DropdownMenuItem<String>(
                                value: value,
                                child: Text('This $value'),
                              );
                            }).toList(),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  if (isDesktop)
                    Row(
                      children: [
                        Expanded(flex: 2, child: WalletCard(balance: metrics['balance'].toString())),
                        const SizedBox(width: 16),
                        Expanded(
                          child: MetricCard(
                            title: 'Total Shipment',
                            value: metrics['shipments'],
                            trendPercentage: '90%',
                            icon: Icons.local_shipping,
                            iconColor: AppColors.warning,
                            iconBackgroundColor: AppColors.warning.withValues(alpha: 0.12),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: MetricCard(
                            title: 'Total Exports',
                            value: metrics['exports'],
                            trendPercentage: '90%',
                            icon: Icons.arrow_upward,
                            iconColor: AppColors.success,
                            iconBackgroundColor: AppColors.success.withValues(alpha: 0.12),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: MetricCard(
                            title: 'Total Import',
                            value: metrics['imports'],
                            trendPercentage: '90%',
                            isTrendUp: false,
                            icon: Icons.arrow_downward,
                            iconColor: AppColors.info,
                            iconBackgroundColor: AppColors.info.withValues(alpha: 0.12),
                          ),
                        ),
                      ],
                    )
                  else
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        WalletCard(balance: metrics['balance'].toString()),
                        const SizedBox(height: 12),
                        MetricCard(
                          title: 'Total Shipment',
                          value: metrics['shipments'],
                          trendPercentage: '90%',
                          icon: Icons.local_shipping,
                          iconColor: AppColors.warning,
                          iconBackgroundColor: AppColors.warning.withValues(alpha: 0.12),
                        ),
                        const SizedBox(height: 12),
                        MetricCard(
                          title: 'Total Exports',
                          value: metrics['exports'],
                          trendPercentage: '90%',
                          icon: Icons.arrow_upward,
                          iconColor: AppColors.success,
                          iconBackgroundColor: AppColors.success.withValues(alpha: 0.12),
                        ),
                        const SizedBox(height: 12),
                        MetricCard(
                          title: 'Total Import',
                          value: metrics['imports'],
                          trendPercentage: '90%',
                          isTrendUp: false,
                          icon: Icons.arrow_downward,
                          iconColor: AppColors.info,
                          iconBackgroundColor: AppColors.info.withValues(alpha: 0.12),
                        ),
                      ],
                    ),

                  const SizedBox(height: 32),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Recent shipment', style: theme.textTheme.titleMedium),
                      OutlinedButton(onPressed: () {}, child: const Text('See All')),
                    ],
                  ),
                  const SizedBox(height: 16),

                  const GrowthChart(),
                  const SizedBox(height: 16),

                  const RecentShipmentCard(
                    trackingId: 'MAF-100-234-291',
                    sender: 'Bunmi Tanny',
                    receiver: 'Mercy',
                    pickUpLocation: 'Lagos, Nigeria',
                    deliveryLocation: 'Oyo Nigeria',
                    amount: '₦3000',
                    status: 'In-Transit',
                    processingTime: '10 hours',
                    isPaid: true,
                  ),
                  const SizedBox(height: 12),
                  const RecentShipmentCard(
                    trackingId: 'MAF-100-234-291',
                    sender: 'Bunmi Tanny',
                    receiver: 'Mercy',
                    pickUpLocation: 'Lagos, Nigeria',
                    deliveryLocation: 'Oyo Nigeria',
                    amount: '₦3000',
                    status: 'Delayed',
                    processingTime: '10 hours',
                    isPaid: false,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}