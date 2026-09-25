export enum ShipmentType {
  EXPORT = 'export',
  IMPORT = 'import',
  DOMESTIC = 'domestic',
}

export enum ShipmentStatus {
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
  DELAYED = 'delayed',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
}
