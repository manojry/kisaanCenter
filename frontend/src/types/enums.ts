// User roles matching backend
export enum UserRole {
  SUPERADMIN = 'superadmin',
  OWNER = 'owner',
  EMPLOYEE = 'employee',
  FARMER = 'farmer',
  BUYER = 'buyer',
  GUEST = 'guest'
}

// Transaction statuses
export enum TransactionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Payment statuses
export enum PaymentStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Credit statuses
export enum CreditStatus {
  OUTSTANDING = 'outstanding',
  PARTIAL = 'partial',
  PAID = 'paid'
}

// Transaction completion status
export enum CompletionStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  COMPLETE = 'complete'
}

// Transaction types
export enum TransactionType {
  SALE = 'sale',
  RETURN = 'return',
  ADJUSTMENT = 'adjustment'
}

// Payment methods
export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  UPI = 'upi',
  CHEQUE = 'cheque',
  CREDIT = 'credit'
}