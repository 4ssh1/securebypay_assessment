String formatAmount(String amount) {
  final parts = amount.split('.');
  final whole = parts.first.replaceAll('-', '');
  final isNegative = parts.first.startsWith('-');
  final fraction = parts.length > 1 ? parts[1].padRight(2, '0').substring(0, 2) : '00';

  final buffer = StringBuffer();
  for (var i = 0; i < whole.length; i++) {
    if (i > 0 && (whole.length - i) % 3 == 0) buffer.write(',');
    buffer.write(whole[i]);
  }

  return '${isNegative ? '-' : ''}$buffer.$fraction';
}

String formatNaira(String amount) => '\u20a6${formatAmount(amount)}';

String formatProcessingTime(int hours) => hours == 1 ? '1 hour' : '$hours hours';

const _monthAbbreviations = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const _weekdayAbbreviations = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

String monthAbbreviation(DateTime date) => _monthAbbreviations[date.month - 1];

String weekdayAbbreviation(DateTime date) => _weekdayAbbreviations[date.weekday - 1];