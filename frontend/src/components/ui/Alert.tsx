import React from 'react';

const Alert: React.FC<{ children?: React.ReactNode; className?: string; variant?: string }> = ({ children, className, variant }) => (
  <div className={`border-l-4 p-4 ${variant === 'destructive' ? 'border-red-400 bg-red-50 text-red-800' : 'border-yellow-400 bg-yellow-50 text-yellow-800'} ${className || ''}`}>{children}</div>
);

export const AlertDescription: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="mt-2 text-sm">{children}</div>
);

export default Alert;
