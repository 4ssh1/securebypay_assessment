
class FormValidators {
  FormValidators._();

  static final _emailRegex = RegExp(r'^[\w.+-]+@[\w-]+(\.[\w-]+)+$');
  static final _passwordComplexity = RegExp(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$');
  static final _phoneRegex = RegExp(r'^\+?[1-9]\d{7,14}$');
  static final _otpRegex = RegExp(r'^\d{6}$');
  static final _amountRegex = RegExp(r'^\d{1,10}(\.\d{1,2})?$');

  static String? validateEmail(String? value) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) return 'Email is required';
    if (trimmed.length > 255) return 'Email is too long';
    if (!_emailRegex.hasMatch(trimmed)) return 'Please enter a valid email address';
    return null;
  }

  static String? validatePassword(String? value) {
    final v = value ?? '';
    if (v.isEmpty) return 'Password is required';
    if (v.length < 10) return 'Password must be at least 10 characters long';
    if (v.length > 128) return 'Password must be at most 128 characters long';
    if (!_passwordComplexity.hasMatch(v)) {
      return 'Password must contain an uppercase letter, a lowercase letter and a number';
    }
    return null;
  }


  static String? validateLoginPassword(String? value) {
    if (value == null || value.isEmpty) return 'Password is required';
    return null;
  }

  static String? validatePasswordConfirmation(String? value, String password) {
    if (value == null || value.isEmpty) return 'Please confirm your password';
    if (value != password) return 'Passwords do not match';
    return null;
  }

  static String? validateRequired(String? value, String fieldName, {int maxLength = 80}) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) return '$fieldName is required';
    if (trimmed.length > maxLength) return '$fieldName must be at most $maxLength characters';
    return null;
  }

  static String? validatePhone(String? value) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) return 'Phone number is required';
    final normalised = normalisePhone(trimmed);
    if (!_phoneRegex.hasMatch(normalised)) return 'Please enter a valid phone number';
    return null;
  }

  static String normalisePhone(String value) => value.replaceAll(RegExp(r'[\s().-]'), '');

  static String? validateOtpCode(String? value) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) return 'Enter the 6-digit code';
    if (!_otpRegex.hasMatch(trimmed)) return 'Code must be 6 digits';
    return null;
  }

  static String? validateFundingAmount(String? value) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) return 'Enter an amount';
    if (!_amountRegex.hasMatch(trimmed)) return 'Enter a valid amount (up to 2 decimal places)';
    final amount = double.tryParse(trimmed) ?? 0;
    if (amount < 100) return 'Minimum funding amount is \u20a6100.00';
    if (amount > 5000000) return 'Maximum funding amount is \u20a65,000,000.00';
    return null;
  }
}