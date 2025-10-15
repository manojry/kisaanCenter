import * as React from "react";
import { cn } from "../../lib/utils";
import { badgeVariants, userTypeBadgeStyles } from "./badge.utils";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  userType?: 'BUYER' | 'FARMER' | 'SHOP';
}

function Badge({ className, variant, userType, children, ...props }: BadgeProps) {
  if (userType) {
    const style = userTypeBadgeStyles[userType.toUpperCase()] || '';
    // Capitalize label for userType
    const label = userType.charAt(0) + userType.slice(1).toLowerCase();
    return (
      <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", style, className)} {...props}>
        {children ?? label}
      </div>
    );
  }
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </div>
  );
}

export { Badge };
