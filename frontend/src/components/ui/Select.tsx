import React from 'react';

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select {...props} className={props.className || 'form-select block w-full'} />
);

export const SelectContent: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;
export const SelectItem: React.FC<{ children?: React.ReactNode; value: string }> = ({ children, value }) => <option value={value}>{children}</option>;
export const SelectTrigger: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;
export const SelectValue: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;
