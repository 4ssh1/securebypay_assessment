enum ShipmentType {
  export,
  import_,
  domestic,
  unknown;

  static ShipmentType fromJson(String? value) => switch (value) {
        'export' => ShipmentType.export,
        'import' => ShipmentType.import_,
        'domestic' => ShipmentType.domestic,
        _ => ShipmentType.unknown,
      };

  String toJson() => switch (this) {
        ShipmentType.export => 'export',
        ShipmentType.import_ => 'import',
        ShipmentType.domestic => 'domestic',
        ShipmentType.unknown => 'domestic',
      };

  String get label => switch (this) {
        ShipmentType.export => 'Export',
        ShipmentType.import_ => 'Import',
        ShipmentType.domestic => 'Domestic',
        ShipmentType.unknown => 'Shipment',
      };
}

enum ShipmentStatus {
  pending,
  inTransit,
  delayed,
  delivered,
  cancelled,
  unknown;

  static ShipmentStatus fromJson(String? value) => switch (value) {
        'pending' => ShipmentStatus.pending,
        'in_transit' => ShipmentStatus.inTransit,
        'delayed' => ShipmentStatus.delayed,
        'delivered' => ShipmentStatus.delivered,
        'cancelled' => ShipmentStatus.cancelled,
        _ => ShipmentStatus.unknown,
      };

  String get label => switch (this) {
        ShipmentStatus.pending => 'Pending',
        ShipmentStatus.inTransit => 'In-Transit',
        ShipmentStatus.delayed => 'Delayed',
        ShipmentStatus.delivered => 'Delivered',
        ShipmentStatus.cancelled => 'Cancelled',
        ShipmentStatus.unknown => 'Unknown',
      };
}

enum PaymentStatus {
  paid,
  unpaid,
  unknown;

  static PaymentStatus fromJson(String? value) => switch (value) {
        'paid' => PaymentStatus.paid,
        'unpaid' => PaymentStatus.unpaid,
        _ => PaymentStatus.unknown,
      };
}

class ShipmentParty {
  const ShipmentParty({required this.name, this.id});

  factory ShipmentParty.fromJson(Map<String, dynamic> json) => ShipmentParty(
        id: json['id'] as String?,
        name: json['name'] as String? ?? '',
      );

  final String? id;
  final String name;
}

class ShipmentRoute {
  const ShipmentRoute({required this.pickUp, required this.delivery});

  factory ShipmentRoute.fromJson(Map<String, dynamic> json) => ShipmentRoute(
        pickUp: json['pickUp'] as String? ?? '',
        delivery: json['delivery'] as String? ?? '',
      );

  final String pickUp;
  final String delivery;
}

class Shipment {
  const Shipment({
    required this.id,
    required this.trackingId,
    required this.sender,
    required this.receiver,
    required this.route,
    required this.amount,
    required this.currency,
    required this.processingTimeHours,
    required this.type,
    required this.status,
    required this.paymentStatus,
    required this.createdAt,
  });

  factory Shipment.fromJson(Map<String, dynamic> json) => Shipment(
        id: json['id'] as String,
        trackingId: json['trackingId'] as String,
        sender: ShipmentParty.fromJson(json['sender'] as Map<String, dynamic>),
        receiver: ShipmentParty.fromJson(json['receiver'] as Map<String, dynamic>),
        route: ShipmentRoute.fromJson(json['route'] as Map<String, dynamic>),
        amount: json['amount'] as String,
        currency: json['currency'] as String? ?? 'NGN',
        processingTimeHours: json['processingTimeHours'] as int? ?? 0,
        type: ShipmentType.fromJson(json['type'] as String?),
        status: ShipmentStatus.fromJson(json['status'] as String?),
        paymentStatus: PaymentStatus.fromJson(json['paymentStatus'] as String?),
        createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
      );

  final String id;
  final String trackingId;
  final ShipmentParty sender;
  final ShipmentParty receiver;
  final ShipmentRoute route;
  final String amount;
  final String currency;
  final int processingTimeHours;
  final ShipmentType type;
  final ShipmentStatus status;
  final PaymentStatus paymentStatus;
  final DateTime createdAt;

  Shipment copyWith({ShipmentStatus? status, PaymentStatus? paymentStatus}) => Shipment(
        id: id,
        trackingId: trackingId,
        sender: sender,
        receiver: receiver,
        route: route,
        amount: amount,
        currency: currency,
        processingTimeHours: processingTimeHours,
        type: type,
        status: status ?? this.status,
        paymentStatus: paymentStatus ?? this.paymentStatus,
        createdAt: createdAt,
      );
}