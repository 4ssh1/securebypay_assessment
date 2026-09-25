import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme.dart';

class UserAvatar extends StatelessWidget {
  final String firstName;
  final String lastName;
  final String? avatarUrl;
  final double size;

  const UserAvatar({
    super.key,
    required this.firstName,
    required this.lastName,
    this.avatarUrl,
    this.size = 36,
  });

  String get _initials {
    final f = firstName.trim().isNotEmpty ? firstName.trim()[0] : '';
    final l = lastName.trim().isNotEmpty ? lastName.trim()[0] : '';
    final initials = '$f$l'.toUpperCase();
    return initials.isNotEmpty ? initials : '?';
  }

  @override
  Widget build(BuildContext context) {
    final hasUrl = avatarUrl != null && avatarUrl!.trim().isNotEmpty;

    return ClipOval(
      child: Container(
        width: size,
        height: size,
        color: AppColors.darkNavy,
        alignment: Alignment.center,
        child: hasUrl
            ? Image.network(
                avatarUrl!,
                width: size,
                height: size,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => _Initials(text: _initials, size: size),
                loadingBuilder: (context, child, progress) {
                  if (progress == null) return child;
                  return _Initials(text: _initials, size: size);
                },
              )
            : _Initials(text: _initials, size: size),
      ),
    );
  }
}

class _Initials extends StatelessWidget {
  final String text;
  final double size;

  const _Initials({required this.text, required this.size});

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: GoogleFonts.dmSans(
        color: Colors.white,
        fontSize: size * 0.38,
        fontWeight: FontWeight.w600,
      ),
    );
  }
}