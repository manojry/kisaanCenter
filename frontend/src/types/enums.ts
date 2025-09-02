// User roles matching backend exactly
export enum UserRole {
  SUPERADMIN = 'superadmin',
  OWNER = 'owner',
  FARMER = 'farmer',
  BUYER = 'buyer',
  EMPLOYEE = 'employee'
  // Removed 'guest' as it's not in backend
}

// Record status matching backend
export enum RecordStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETED = 'deleted'
  // Removed 'suspended' as it's not in backend consistently
}

// Transaction statuses matching backend
export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
  // Removed 'failed' as it's not in backend consistently
}

// Payment statuses matching backend
export enum PaymentStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  COMPLETED = 'completed',
  FAILED = 'failed'
  // Updated to match backend schema
}

// Credit statuses matching backend
export enum CreditStatus {
  OUTSTANDING = 'outstanding',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue'
  // Updated to match backend schema
}

// Transaction completion status matching backend
export enum CompletionStatus {
  INCOMPLETE = 'incomplete',
  COMPLETE = 'complete'
  // Removed 'pending' as it's not consistently in backend
}

// Transaction types matching backend
export enum TransactionType {
  SALE = 'sale',
  RETURN = 'return',
  ADJUSTMENT = 'adjustment'
  // Removed 'purchase' as it's not in backend
}

// Payment types matching backend
export enum PaymentType {
  FULL_PAYMENT = 'full_payment',
  PARTIAL_PAYMENT = 'partial_payment',
  ADVANCE = 'advance'
  // Updated to match backend schema
}

// Farmer payment types matching backend
export enum FarmerPaymentType {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  CHEQUE = 'cheque'
  // Updated to match backend schema
}

// Stock status matching backend
export enum StockStatus {
  IN_STOCK = 'in_stock',
  OUT_OF_STOCK = 'out_of_stock',
  EXPIRED = 'expired'
  // Updated to match backend schema
}
