import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../../core/models/dashboard.dart';
import '../../../core/theme.dart';
import '../../../utils/format.dart';
import '../dashboard_providers.dart';


class GrowthChart extends HookConsumerWidget {
  const GrowthChart({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final primaryColor = theme.primaryColor;
    final gridColor = AppColors.border;

    final selectedGranularity = useState(GrowthGranularity.year);
    final growthAsync = ref.watch(growthProvider(selectedGranularity.value));

    String labelFor(GrowthPoint point) => switch (selectedGranularity.value) {
          GrowthGranularity.year => monthAbbreviation(point.date),
          GrowthGranularity.month => point.date.day.toString(),
          GrowthGranularity.week => weekdayAbbreviation(point.date),
        };

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: gridColor),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  'Company Growth',
                  style: theme.textTheme.titleMedium,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 12),
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: AppColors.background.withValues(alpha: 0.35),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: GrowthGranularity.values.map((g) {
                    final isActive = selectedGranularity.value == g;
                    return GestureDetector(
                      onTap: () => selectedGranularity.value = g,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                        decoration: BoxDecoration(
                          color: isActive ? Colors.white : Colors.transparent,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          g.label,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                            color: isActive ? AppColors.textPrimary : AppColors.textSecondary,
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 240,
            child: growthAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, stack) => Center(
                child: Text('Could not load growth data', style: theme.textTheme.bodySmall),
              ),
              data: (data) {
                final points = data.points;
                if (points.isEmpty) return const SizedBox.shrink();

                final maxShipments = points.map((p) => p.shipments).fold<int>(0, (a, b) => a > b ? a : b);
                final maxY = maxShipments == 0 ? 10.0 : maxShipments * 1.2;

                return LayoutBuilder(
                  builder: (context, constraints) {
                    final chartWidth = constraints.maxWidth > 560 ? constraints.maxWidth : 560.0;

                    return SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: SizedBox(
                        width: chartWidth,
                        child: LineChart(
                          LineChartData(
                            lineTouchData: LineTouchData(
                              touchTooltipData: LineTouchTooltipData(
                                getTooltipColor: (touchedSpot) => primaryColor,
                                getTooltipItems: (touchedSpots) {
                                  return touchedSpots.map((spot) {
                                    return LineTooltipItem(
                                      spot.y.toInt().toString(),
                                      GoogleFonts.dmSans(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 12,
                                      ),
                                    );
                                  }).toList();
                                },
                              ),
                            ),
                            gridData: FlGridData(
                              show: true,
                              drawVerticalLine: false,
                              getDrawingHorizontalLine: (value) {
                                return FlLine(color: gridColor, strokeWidth: 1, dashArray: [5, 5]);
                              },
                            ),
                            titlesData: FlTitlesData(
                              rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                              topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                              bottomTitles: AxisTitles(
                                sideTitles: SideTitles(
                                  showTitles: true,
                                  interval: 1,
                                  getTitlesWidget: (value, meta) {
                                    final i = value.toInt();
                                    if (i < 0 || i >= points.length) return const SizedBox.shrink();
                                    return Padding(
                                      padding: const EdgeInsets.only(top: 8.0),
                                      child: Text(labelFor(points[i]), style: theme.textTheme.bodySmall),
                                    );
                                  },
                                ),
                              ),
                              leftTitles: AxisTitles(
                                sideTitles: SideTitles(
                                  showTitles: true,
                                  reservedSize: 36,
                                  getTitlesWidget: (value, meta) =>
                                      Text(value.toInt().toString(), style: theme.textTheme.bodySmall),
                                ),
                              ),
                            ),
                            borderData: FlBorderData(show: false),
                            minX: 0,
                            maxX: (points.length - 1).toDouble(),
                            minY: 0,
                            maxY: maxY,
                            lineBarsData: [
                              LineChartBarData(
                                spots: [
                                  for (var i = 0; i < points.length; i++)
                                    FlSpot(i.toDouble(), points[i].shipments.toDouble()),
                                ],
                                isCurved: true,
                                color: primaryColor,
                                barWidth: 2,
                                isStrokeCapRound: true,
                                dotData: const FlDotData(show: false),
                                belowBarData: BarAreaData(show: true, color: primaryColor.withValues(alpha: 0.1)),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}