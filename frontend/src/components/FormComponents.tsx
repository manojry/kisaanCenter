import React from 'react';
import './FormComponents.css';

// Form Container
interface FormProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  className?: string;
}

export const Form: React.FC<FormProps> = ({ children, onSubmit, className = '' }) => {
  return (
    <form className={`form ${className}`} onSubmit={onSubmit} noValidate>
      {children}
    </form>
  );
};

// Form Section
interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({ 
  title, 
  description, 
  children, 
  className = '' 
}) => {
  return (
    <div className={`form-section ${className}`}>
      {(title || description) && (
        <div className="form-section-header">
          {title && <h3 className="form-section-title">{title}</h3>}
          {description && <p className="form-section-description">{description}</p>}
        </div>
      )}
      <div className="form-section-content">
        {children}
      </div>
    </div>
  );
};

// Input Field
interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  icon?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  helpText,
  icon,
  min,
  max,
  step,
  className = ''
}) => {
  const inputId = `input-${name}`;

  return (
    <div className={`form-group ${error ? 'has-error' : ''} ${className}`}>
      <label htmlFor={inputId} className="form-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
      
      <div className={`input-wrapper ${icon ? 'has-icon' : ''}`}>
        {icon && <span className="input-icon">{icon}</span>}
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className={`form-input ${error ? 'error' : ''}`}
          aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined}
        />
      </div>
      
      {error && (
        <p id={`${inputId}-error`} className="form-error" role="alert">
          <span className="error-icon">⚠️</span>
          {error}
        </p>
      )}
      
      {!error && helpText && (
        <p id={`${inputId}-help`} className="form-help">
          {helpText}
        </p>
      )}
    </div>
  );
};

// Select Field
interface SelectFieldProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ value: string | number; label: string; disabled?: boolean }>;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  required = false,
  disabled = false,
  error,
  helpText,
  className = ''
}) => {
  const selectId = `select-${name}`;

  return (
    <div className={`form-group ${error ? 'has-error' : ''} ${className}`}>
      <label htmlFor={selectId} className="form-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
      
      <div className="select-wrapper">
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`form-select ${error ? 'error' : ''}`}
          aria-describedby={error ? `${selectId}-error` : helpText ? `${selectId}-help` : undefined}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <span className="select-arrow">▼</span>
      </div>
      
      {error && (
        <p id={`${selectId}-error`} className="form-error" role="alert">
          <span className="error-icon">⚠️</span>
          {error}
        </p>
      )}
      
      {!error && helpText && (
        <p id={`${selectId}-help`} className="form-help">
          {helpText}
        </p>
      )}
    </div>
  );
};

// Textarea Field
interface TextareaFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  rows?: number;
  maxLength?: number;
  className?: string;
}

export const TextareaField: React.FC<TextareaFieldProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  helpText,
  rows = 4,
  maxLength,
  className = ''
}) => {
  const textareaId = `textarea-${name}`;
  const remainingChars = maxLength ? maxLength - value.length : null;

  return (
    <div className={`form-group ${error ? 'has-error' : ''} ${className}`}>
      <div className="textarea-header">
        <label htmlFor={textareaId} className="form-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
        {maxLength && (
          <span className={`char-count ${remainingChars !== null && remainingChars < 20 ? 'warning' : ''}`}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      
      <textarea
        id={textareaId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        className={`form-textarea ${error ? 'error' : ''}`}
        aria-describedby={error ? `${textareaId}-error` : helpText ? `${textareaId}-help` : undefined}
      />
      
      {error && (
        <p id={`${textareaId}-error`} className="form-error" role="alert">
          <span className="error-icon">⚠️</span>
          {error}
        </p>
      )}
      
      {!error && helpText && (
        <p id={`${textareaId}-help`} className="form-help">
          {helpText}
        </p>
      )}
    </div>
  );
};

// Checkbox Field
interface CheckboxFieldProps {
  label: string;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  label,
  name,
  checked,
  onChange,
  disabled = false,
  error,
  helpText,
  className = ''
}) => {
  const checkboxId = `checkbox-${name}`;

  return (
    <div className={`form-group checkbox-group ${error ? 'has-error' : ''} ${className}`}>
      <div className="checkbox-wrapper">
        <input
          id={checkboxId}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className={`form-checkbox ${error ? 'error' : ''}`}
          aria-describedby={error ? `${checkboxId}-error` : helpText ? `${checkboxId}-help` : undefined}
        />
        <label htmlFor={checkboxId} className="checkbox-label">
          {label}
        </label>
      </div>
      
      {error && (
        <p id={`${checkboxId}-error`} className="form-error" role="alert">
          <span className="error-icon">⚠️</span>
          {error}
        </p>
      )}
      
      {!error && helpText && (
        <p id={`${checkboxId}-help`} className="form-help">
          {helpText}
        </p>
      )}
    </div>
  );
};

// Form Actions
interface FormActionsProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export const FormActions: React.FC<FormActionsProps> = ({ 
  children, 
  align = 'right', 
  className = '' 
}) => {
  return (
    <div className={`form-actions align-${align} ${className}`}>
      {children}
    </div>
  );
};

// Form Row (for grouping fields horizontally)
interface FormRowProps {
  children: React.ReactNode;
  columns?: number;
  className?: string;
}

export const FormRow: React.FC<FormRowProps> = ({ 
  children, 
  columns = 2, 
  className = '' 
}) => {
  return (
    <div className={`form-row cols-${columns} ${className}`}>
      {children}
    </div>
  );
};
