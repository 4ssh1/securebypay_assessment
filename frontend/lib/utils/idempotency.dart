import 'dart:math';

const _chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
final _random = Random.secure();

String generateFundingReference() {
  final suffix = List.generate(16, (_) => _chars[_random.nextInt(_chars.length)]).join();
  return 'fund-${DateTime.now().millisecondsSinceEpoch}-$suffix';
}