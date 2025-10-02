import React from 'react';
import { Badge } from './badge';

export type UserType = 'BUYER' | 'FARMER' | 'SHOP';

interface UserTypeBadgeProps {
  type: string;
  className?: string;
}

// Accept lowercase or uppercase, always map to uppercase for style
function normalizeType(type: string) {
  return (type || '').toUpperCase();
}



// Use pastel color scheme for user roles (global)
const badgeStyles: Record<string, string> = {
  BUYER: 'bg-[#E0F2FE] text-[#0369A1] border border-[#7DD3FC]', // light blue bg, blue text, blue border
  FARMER: 'bg-[#DCFCE7] text-[#166534] border border-[#86EFAC]', // light green bg, green text, green border
  SHOP: 'bg-[#F3E8FF] text-[#7C3AED] border border-[#C4B5FD]', // light purple bg, purple text, purple border
};

function UserTypeBadge({ type, className = '' }: Readonly<UserTypeBadgeProps>) {
  const normType = normalizeType(type);
  const style = badgeStyles[normType] || '';
  return <Badge variant="outline" className={`${style} ${className}`}>{normType.charAt(0) + normType.slice(1).toLowerCase()}</Badge>;
}

export { UserTypeBadge };