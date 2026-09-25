import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../core/theme.dart';
import '../../core/responsive.dart';

class SplitLayout extends StatelessWidget {
  final Widget child;
  final String bannerHeadline;
  final String bannerSubtext;

  const SplitLayout({
    super.key,
    required this.child,
    this.bannerHeadline = 'Seamlessly Delivering to Over 300\nCountries from Nigeria!',
    this.bannerSubtext = 'Access global markets with our quick shipping from Nigeria! Fast\ndelivery and easy customs to 300+ countries.',
  });

  @override
  Widget build(BuildContext context) {
    final showBanner = !Responsive.isMobile(context);
    final isDesktop = Responsive.isDesktop(context);
    final horizontalPadding = Responsive.isMobile(context) ? 24.0 : 56.0;
    final viewportHeight = MediaQuery.sizeOf(context).height;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverFillRemaining(
            hasScrollBody: false,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  flex: 1,
                  child: Padding(
                    padding: EdgeInsets.symmetric(horizontal: horizontalPadding, vertical: 138),
                    child: Align(
                      alignment: Alignment.topCenter,
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 440),
                        child: child,
                      ),
                    ),
                  ),
                ),

                if (showBanner)
                  Expanded(
                    flex: 1,
                    child: Container(
                      color: AppColors.primary,
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          SvgPicture.asset(
                            'assets/images/map.svg',
                            fit: BoxFit.cover,
                          ),
                          Positioned(
                            top: 0,
                            left: 0,
                            right: 0,
                            height: viewportHeight,
                            child: Padding(
                              padding: const EdgeInsets.all(56.0),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.end,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    bannerHeadline,
                                    style: GoogleFonts.dmSans(
                                      fontSize: isDesktop ? 30 : 24,
                                      fontWeight: FontWeight.w700,
                                      color: Colors.white,
                                      height: 1.3,
                                    ),
                                  ),
                                  const SizedBox(height: 14),
                                  Text(
                                    bannerSubtext,
                                    style: GoogleFonts.dmSans(
                                      fontSize: isDesktop ? 15 : 13.5,
                                      color: Colors.white.withValues(alpha: 0.9),
                                      height: 1.5,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}