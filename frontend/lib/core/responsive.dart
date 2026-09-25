import 'package:flutter/material.dart';

class Breakpoints {
  Breakpoints._();
  static const double mobile = 600;
  static const double tablet = 900;
}

class Responsive {
  Responsive._();

  static double _widthOf(BuildContext context) => MediaQuery.sizeOf(context).width;

  static bool isMobile(BuildContext context) => _widthOf(context) < Breakpoints.mobile;

  static bool isTablet(BuildContext context) {
    final w = _widthOf(context);
    return w >= Breakpoints.mobile && w < Breakpoints.tablet;
  }

  static bool isDesktop(BuildContext context) => _widthOf(context) >= Breakpoints.tablet;

  static double font(BuildContext context, {required double min, required double max}) {
    final width = _widthOf(context);
    
    const double minScreenWidth = 375.0; 
    const double maxScreenWidth = 1440.0;

    if (width <= minScreenWidth) return min;
    if (width >= maxScreenWidth) return max;

    return min + (max - min) * ((width - minScreenWidth) / (maxScreenWidth - minScreenWidth));
  }
}