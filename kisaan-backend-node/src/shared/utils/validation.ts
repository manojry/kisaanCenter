/**
 * Validation Utilities
 * Comprehensive validation functions for all data types
 */

import { VALIDATION, USER_ROLES, USER_STATUS, TRANSACTION_STATUS } from '../constants';

/**
 * Validation Result Interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Field Validation Rules
 */
export interface FieldValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean;
  errorMessage?: string;
}

/**
 * Schema Validation Rules
 */
export type ValidationSchema = Record<string, FieldValidationRule>;

/**
 * Basic Type Validators
 */
export class TypeValidators {
  static isString(value: any): boolean {
    return typeof value === 'string';
  }

  static isNumber(value: any): boolean {
    return typeof value === 'number' && !isNaN(value);
  }

  static isBoolean(value: any): boolean {
    return typeof value === 'boolean';
  }

  static isArray(value: any): boolean {
    return Array.isArray(value);
  }

  static isObject(value: any): boolean {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  static isDate(value: any): boolean {
    return value instanceof Date && !isNaN(value.getTime());
  }

  static isEmail(value: string): boolean {
    return VALIDATION.EMAIL_PATTERN.test(value) && value.length <= VALIDATION.EMAIL_MAX_LENGTH;
  }

  static isPhone(value: string): boolean {
    const cleanPhone = value.replace(/\s/g, '');
    return VALIDATION.PHONE_PATTERN.test(cleanPhone) && 
           cleanPhone.length >= VALIDATION.PHONE_MIN_LENGTH && 
           cleanPhone.length <= VALIDATION.PHONE_MAX_LENGTH;
  }

  static isUsername(value: string): boolean {
    return VALIDATION.USERNAME_PATTERN.test(value) &&
           value.length >= VALIDATION.USERNAME_MIN_LENGTH &&
           value.length <= VALIDATION.USERNAME_MAX_LENGTH;
  }

  static isStrongPassword(value: string): boolean {
    if (value.length < VALIDATION.PASSWORD_MIN_LENGTH || value.length > VALIDATION.PASSWORD_MAX_LENGTH) {
      return false;
    }
    
    // Check for at least one uppercase, lowercase, number, and special character
    const hasUppercase = /[A-Z]/.test(value);
    const hasLowercase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    
    return hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
  }

  static isPositiveNumber(value: number): boolean {
    return this.isNumber(value) && value > 0;
  }

  static isDecimal(value: number, precision: number = VALIDATION.DECIMAL_PRECISION): boolean {
    if (!this.isNumber(value)) return false;
    
    const decimalPlaces = (value.toString().split('.')[1] || '').length;
    return decimalPlaces <= precision;
  }

  static isValidRole(value: string): boolean {
    return Object.values(USER_ROLES).includes(value as any);
  }

  static isValidStatus(value: string): boolean {
    return Object.values(USER_STATUS).includes(value as any);
  }

  static isValidTransactionStatus(value: string): boolean {
    return Object.values(TRANSACTION_STATUS).includes(value as any);
  }
}

/**
 * Field Validator Class
 */
export class FieldValidator {
  private errors: string[] = [];

  validate(value: any, fieldName: string, rules: FieldValidationRule): ValidationResult {
    this.errors = [];

    // Required validation
    if (rules.required && this.isEmpty(value)) {
      this.errors.push(`${fieldName} is required`);
      return { isValid: false, errors: this.errors };
    }

    // Skip other validations if value is empty and not required
    if (this.isEmpty(value)) {
      return { isValid: true, errors: [] };
    }

    // String validations
    if (typeof value === 'string') {
      this.validateString(value, fieldName, rules);
    }

    // Custom validator
    if (rules.customValidator && !rules.customValidator(value)) {
      this.errors.push(rules.errorMessage || `${fieldName} is invalid`);
    }

    return {
      isValid: this.errors.length === 0,
      errors: this.errors
    };
  }

  private isEmpty(value: any): boolean {
    return value === null || value === undefined || value === '';
  }

  private validateString(value: string, fieldName: string, rules: FieldValidationRule): void {
    // Length validations
    if (rules.minLength && value.length < rules.minLength) {
      this.errors.push(`${fieldName} must be at least ${rules.minLength} characters long`);
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      this.errors.push(`${fieldName} must not exceed ${rules.maxLength} characters`);
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      this.errors.push(rules.errorMessage || `${fieldName} format is invalid`);
    }
  }
}

/**
 * Schema Validator Class
 */
export class SchemaValidator {
  private fieldValidator = new FieldValidator();

  validate(data: Record<string, any>, schema: ValidationSchema): ValidationResult {
    const allErrors: string[] = [];

    for (const [fieldName, rules] of Object.entries(schema)) {
      const fieldValue = data[fieldName];
      const result = this.fieldValidator.validate(fieldValue, fieldName, rules);
      
      if (!result.isValid) {
        allErrors.push(...result.errors);
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors
    };
  }
}

/**
 * Common Validation Schemas
 */
export const ValidationSchemas = {
  user: {
    username: {
      required: true,
      minLength: VALIDATION.USERNAME_MIN_LENGTH,
      maxLength: VALIDATION.USERNAME_MAX_LENGTH,
      pattern: VALIDATION.USERNAME_PATTERN,
      errorMessage: 'Username must contain only letters, numbers, and underscores'
    },
    password: {
      required: true,
      customValidator: TypeValidators.isStrongPassword,
      errorMessage: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
    },
    email: {
      required: true,
      customValidator: TypeValidators.isEmail,
      errorMessage: 'Invalid email format'
    },
    firstname: {
      required: true,
      minLength: VALIDATION.NAME_MIN_LENGTH,
      maxLength: VALIDATION.NAME_MAX_LENGTH
    },
    contact: {
      required: false,
      customValidator: TypeValidators.isPhone,
      errorMessage: 'Invalid phone number format'
    },
    role: {
      required: true,
      customValidator: TypeValidators.isValidRole,
      errorMessage: 'Invalid user role'
    },
    status: {
      required: false,
      customValidator: TypeValidators.isValidStatus,
      errorMessage: 'Invalid user status'
    }
  },

  shop: {
    name: {
      required: true,
      minLength: VALIDATION.NAME_MIN_LENGTH,
      maxLength: VALIDATION.NAME_MAX_LENGTH
    },
    location: {
      required: true,
      minLength: VALIDATION.NAME_MIN_LENGTH,
      maxLength: VALIDATION.NAME_MAX_LENGTH
    },
    contact: {
      required: false,
      customValidator: TypeValidators.isPhone,
      errorMessage: 'Invalid phone number format'
    }
  },

  product: {
    name: {
      required: true,
      minLength: VALIDATION.NAME_MIN_LENGTH,
      maxLength: VALIDATION.NAME_MAX_LENGTH
    },
    price: {
      required: true,
      customValidator: (value: any) => TypeValidators.isPositiveNumber(value) && TypeValidators.isDecimal(value),
      errorMessage: 'Price must be a positive decimal number'
    },
    quantity: {
      required: true,
      customValidator: (value: any) => TypeValidators.isPositiveNumber(value) && TypeValidators.isDecimal(value),
      errorMessage: 'Quantity must be a positive decimal number'
    }
  },

  transaction: {
    quantity: {
      required: true,
      customValidator: (value: any) => TypeValidators.isPositiveNumber(value) && TypeValidators.isDecimal(value),
      errorMessage: 'Quantity must be a positive decimal number'
    },
    price_per_unit: {
      required: true,
      customValidator: (value: any) => TypeValidators.isPositiveNumber(value) && TypeValidators.isDecimal(value),
      errorMessage: 'Price per unit must be a positive decimal number'
    },
    status: {
      required: false,
      customValidator: TypeValidators.isValidTransactionStatus,
      errorMessage: 'Invalid transaction status'
    }
  }
};

/**
 * Sanitization Functions
 */
export class Sanitizer {
  static sanitizeString(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
  }

  static sanitizeEmail(value: string): string {
    return value.trim().toLowerCase();
  }

  static sanitizePhone(value: string): string {
    return value.replace(/\D/g, '');
  }

  static sanitizeUsername(value: string): string {
    return value.trim().toLowerCase();
  }

  static sanitizeDecimal(value: number, precision: number = VALIDATION.DECIMAL_PRECISION): number {
    return Number(value.toFixed(precision));
  }

  static sanitizeObject(obj: Record<string, any>, fieldsToSanitize: string[]): Record<string, any> {
    const sanitized = { ...obj };
    
    for (const field of fieldsToSanitize) {
      if (sanitized[field] && typeof sanitized[field] === 'string') {
        sanitized[field] = this.sanitizeString(sanitized[field]);
      }
    }
    
    return sanitized;
  }
}

/**
 * Validation Helper Functions
 */
export const ValidationHelpers = {
  /**
   * Validate and sanitize user input
   */
  validateAndSanitizeUser(userData: any): { isValid: boolean; errors: string[]; sanitizedData?: any } {
    const validator = new SchemaValidator();
    
    // Sanitize first
    const sanitizedData = {
      ...userData,
      username: userData.username ? Sanitizer.sanitizeUsername(userData.username) : undefined,
      email: userData.email ? Sanitizer.sanitizeEmail(userData.email) : undefined,
      firstname: userData.firstname ? Sanitizer.sanitizeString(userData.firstname) : undefined,
      contact: userData.contact ? Sanitizer.sanitizePhone(userData.contact) : undefined
    };

    // Then validate
    const result = validator.validate(sanitizedData, ValidationSchemas.user);
    
    return {
      isValid: result.isValid,
      errors: result.errors,
      sanitizedData: result.isValid ? sanitizedData : undefined
    };
  },

  /**
   * Validate pagination parameters
   */
  validatePagination(page?: number, limit?: number): { isValid: boolean; errors: string[]; sanitizedData?: any } {
    const errors: string[] = [];
    
    const sanitizedPage = page && page > 0 ? Math.floor(page) : 1;
    const sanitizedLimit = limit && limit > 0 ? Math.min(Math.floor(limit), 100) : 10;
    
    if (page && page <= 0) {
      errors.push('Page must be a positive number');
    }
    
    if (limit && (limit <= 0 || limit > 100)) {
      errors.push('Limit must be between 1 and 100');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: {
        page: sanitizedPage,
        limit: sanitizedLimit
      }
    };
  },

  /**
   * Validate ID parameter
   */
  validateId(id: any): { isValid: boolean; errors: string[]; sanitizedData?: number } {
    if (!id) {
      return { isValid: false, errors: ['ID is required'] };
    }
    
    const numericId = Number(id);
    
    if (isNaN(numericId) || numericId <= 0 || !Number.isInteger(numericId)) {
      return { isValid: false, errors: ['ID must be a positive integer'] };
    }
    
    return {
      isValid: true,
      errors: [],
      sanitizedData: numericId
    };
  }
};

/**
 * Create validator instances
 */
export const fieldValidator = new FieldValidator();
export const schemaValidator = new SchemaValidator();