import 'package:flutter/material.dart';
import '../../../core/theme.dart';

class RecentShipmentCard extends StatelessWidget {
  final String trackingId;
  final String sender;
  final String receiver;
  final String pickUpLocation;
  final String deliveryLocation;
  final String amount;
  final String status;
  final String processingTime;
  final bool isPaid;

  final bool showPayment;

  const RecentShipmentCard({
    super.key,
    required this.trackingId,
    required this.sender,
    required this.receiver,
    required this.pickUpLocation,
    required this.deliveryLocation,
    required this.amount,
    required this.status,
    required this.processingTime,
    required this.isPaid,
    this.showPayment = true,
  });

  Color _getStatusColor() {
    switch (status.toLowerCase()) {
      case 'in-transit':
        return AppColors.warning;
      case 'delayed':
        return const Color(0xFF2FB6C4);
      case 'delivered':
        return AppColors.success;
      case 'cancelled':
        return AppColors.danger;
      default:
        return AppColors.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final isMobile = constraints.maxWidth < 650;

          return Padding(
            padding: const EdgeInsets.all(20),
            child: isMobile ? _buildMobileLayout(context, theme) : _buildDesktopLayout(context, theme),
          );
        },
      ),
    );
  }

  Widget _buildDesktopLayout(BuildContext context, ThemeData theme) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(flex: 2, child: _buildDetailColumn(context, 'Tracking ID', trackingId, isPrimary: true)),
            const SizedBox(width: 16),
            Expanded(flex: 2, child: _buildDetailColumn(context, 'Sender', sender)),
            const SizedBox(width: 16),
            Expanded(flex: 2, child: _buildDetailColumn(context, 'Receiver', receiver)),
            const SizedBox(width: 16),
            const Icon(Icons.keyboard_arrow_up, color: AppColors.textSecondary, size: 20),
          ],
        ),
        const SizedBox(height: 20),
        const Divider(color: AppColors.border),
        const SizedBox(height: 20),

        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(flex: 2, child: _buildLocationColumn(context, 'Pick Up From', pickUpLocation)),
            const SizedBox(width: 16),
            Expanded(flex: 2, child: _buildLocationColumn(context, 'Delivery To', deliveryLocation)),
            const SizedBox(width: 16),
            Expanded(flex: 1, child: _buildDetailColumn(context, 'Amount', amount)),
            const SizedBox(width: 16),
            Expanded(flex: 1, child: _buildStatus(context, theme)),
          ],
        ),
        const SizedBox(height: 20),

        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _buildProcessingTime(context, theme),
            _buildActions(context, theme),
          ],
        ),
      ],
    );
  }

  Widget _buildMobileLayout(BuildContext context, ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _buildDetailColumn(context, 'Tracking ID', trackingId, isPrimary: true),
            const Icon(Icons.keyboard_arrow_up, color: AppColors.textSecondary, size: 20),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(child: _buildDetailColumn(context, 'Sender', sender)),
            Expanded(child: _buildDetailColumn(context, 'Receiver', receiver)),
          ],
        ),
        const SizedBox(height: 16),
        const Divider(color: AppColors.border),
        const SizedBox(height: 16),

        _buildLocationColumn(context, 'Pick Up From', pickUpLocation),
        const SizedBox(height: 16),
        _buildLocationColumn(context, 'Delivery To', deliveryLocation),
        const SizedBox(height: 16),
        const Divider(color: AppColors.border),
        const SizedBox(height: 16),

        Row(
          children: [
            Expanded(child: _buildDetailColumn(context, 'Amount', amount)),
            Expanded(child: _buildStatus(context, theme)),
          ],
        ),
        const SizedBox(height: 20),

        _buildProcessingTime(context, theme),
        const SizedBox(height: 16),

        SizedBox(
          width: double.infinity,
          child: Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              OutlinedButton(onPressed: () {}, child: const Text('View More')),
              if (showPayment)
                ElevatedButton(
                  onPressed: isPaid ? null : () {},
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isPaid ? const Color(0xFFE4E4E4) : AppColors.darkNavy,
                    foregroundColor: isPaid ? AppColors.textSecondary : Colors.white,
                  ),
                  child: Text(isPaid ? 'Paid' : 'Pay Now'),
                ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStatus(BuildContext context, ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Status', style: theme.textTheme.bodySmall),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(color: _getStatusColor().withValues(alpha: 0.12), borderRadius: BorderRadius.circular(16)),
          child: Text(
            status,
            style: theme.textTheme.bodySmall?.copyWith(color: _getStatusColor(), fontWeight: FontWeight.bold),
          ),
        ),
      ],
    );
  }

  Widget _buildProcessingTime(BuildContext context, ThemeData theme) {
    return Row(
      children: [
        const Icon(Icons.timer_outlined, color: AppColors.textSecondary, size: 18),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Processing time', style: theme.textTheme.bodySmall),
            Text(processingTime, style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w500)),
          ],
        ),
      ],
    );
  }

  Widget _buildActions(BuildContext context, ThemeData theme) {
    return Row(
      children: [
        OutlinedButton(onPressed: () {}, child: const Text('View More')),
        if (showPayment) ...[
          const SizedBox(width: 12),
          ElevatedButton(
            onPressed: isPaid ? null : () {},
            style: ElevatedButton.styleFrom(
              backgroundColor: isPaid ? const Color(0xFFE4E4E4) : AppColors.darkNavy,
              foregroundColor: isPaid ? AppColors.textSecondary : Colors.white,
            ),
            child: Text(isPaid ? 'Paid' : 'Pay Now'),
          ),
        ],
      ],
    );
  }

  Widget _buildDetailColumn(BuildContext context, String label, String value, {bool isPrimary = false}) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: theme.textTheme.bodySmall),
        const SizedBox(height: 6),
        Text(
          value,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: isPrimary ? theme.primaryColor : theme.textTheme.bodyMedium?.color,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildLocationColumn(BuildContext context, String label, String value) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: theme.textTheme.bodySmall),
        const SizedBox(height: 6),
        Row(
          children: [
            Container(
              width: 16,
              height: 11,
              decoration: BoxDecoration(color: AppColors.success, borderRadius: BorderRadius.circular(2)),
            ),
            const SizedBox(width: 8),
            Flexible(
              child: Text(
                value,
                style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ],
    );
  }
}