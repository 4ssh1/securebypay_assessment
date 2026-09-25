import 'package:flutter/material.dart';
import '../../../core/theme.dart';

class MetricCard extends StatelessWidget {
  final String title;
  final int value;

  final double? changePercent;
  final int previousCount;
  final IconData icon;
  final Color iconColor;
  final Color iconBackgroundColor;

  const MetricCard({
    super.key,
    required this.title,
    required this.value,
    required this.changePercent,
    required this.previousCount,
    required this.icon,
    required this.iconColor,
    required this.iconBackgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final change = changePercent;
    final isUp = (change ?? 0) >= 0;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: iconBackgroundColor, borderRadius: BorderRadius.circular(8)),
                child: Icon(icon, color: iconColor, size: 18),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  style: theme.textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary, fontWeight: FontWeight.w500),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Text(
                  '$value',
                  style: theme.textTheme.headlineLarge?.copyWith(fontSize: 22),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (change != null)
                Row(
                  children: [
                    Icon(
                      isUp ? Icons.arrow_upward : Icons.arrow_downward,
                      color: isUp ? AppColors.success : AppColors.danger,
                      size: 14,
                    ),
                    const SizedBox(width: 3),
                    Text(
                      '${change.abs().toStringAsFixed(1)}%',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: isUp ? AppColors.success : AppColors.danger,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                )
              else
                Text('—', style: theme.textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary)),
            ],
          ),
          const SizedBox(height: 6),
          Text('vs last month: $previousCount', style: theme.textTheme.bodySmall),
        ],
      ),
    );
  }
}