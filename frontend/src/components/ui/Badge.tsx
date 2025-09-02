import React from 'react';

const Badge: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <span className={className || 'inline-block px-2 py-1 text-xs rounded bg-gray-100 text-gray-800'}>{children}</span>
);

export default Badge;
