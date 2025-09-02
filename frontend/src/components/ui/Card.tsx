import React from 'react';

const Card: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={className || 'bg-white rounded-lg shadow p-4'}>{children}</div>
);

export const CardHeader: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={className || 'font-bold text-lg mb-2'}>{children}</div>
);

export const CardContent: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={className || ''}>{children}</div>
);

export default Card;
