// User roles matching backend
export enum UserRole {
  SUPERADMIN = 'superadmin',
  OWNER = 'owner',
  FARMER = 'farmer',
  BUYER = 'buyer',
  EMPLOYEE = 'employee'
}

export enum RecordStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DELETED = 'DELETED'
}

// Transaction statuses
export enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// Payment statuses
export enum PaymentStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

// Credit statuses
export enum CreditStatus {
  OUTSTANDING = 'OUTSTANDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE'
}

// Transaction completion status
export enum CompletionStatus {
  INCOMPLETE = 'INCOMPLETE',
  COMPLETE = 'COMPLETE'
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

export enum PaymentType {
  FULL_PAYMENT = 'FULL_PAYMENT',
  PARTIAL_PAYMENT = 'PARTIAL_PAYMENT',
  ADVANCE = 'ADVANCE'
}
