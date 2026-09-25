import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme.dart';
import '../../core/responsive.dart';
import 'app_sidebar.dart';

class ComingSoonPage extends StatelessWidget {
  final String title;

  const ComingSoonPage({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDesktop = Responsive.isDesktop(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: isDesktop
          ? null
          : AppBar(
              backgroundColor: Colors.white,
              elevation: 0,
              iconTheme: IconThemeData(color: theme.primaryColor),
              title: Text(
                title,
                style: GoogleFonts.dmSans(color: theme.primaryColor, fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ),
      drawer: isDesktop ? null : Drawer(child: AppSidebar(activeRoute: title)),
      body: Row(
        children: [
          if (isDesktop) AppSidebar(activeRoute: title),
          Expanded(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(color: theme.primaryColor.withValues(alpha: 0.1), shape: BoxShape.circle),
                      child: Icon(Icons.build_circle_outlined, size: 64, color: theme.primaryColor),
                    ),
                    const SizedBox(height: 20),
                    Text('$title is coming soon', style: theme.textTheme.headlineLarge, textAlign: TextAlign.center),
                    const SizedBox(height: 10),
                    Text(
                      'We are currently working hard to bring this feature to you.',
                      style: theme.textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}