import { User } from '../user/types';
import { Shop } from '../shop/types';
import { Product } from '../product/types';
import { Transaction } from '../transaction/types';

export enum CommissionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PAID = 'paid',
  DISPUTED = 'disputed'
}

export enum CommissionType {
  PERCENTAGE = 'percentage',
  FLAT_RATE = 'flat_rate',
  TIERED = 'tiered'
}

export interface CommissionRule {
  id: string;
  shop_id: string;
  product_id?: string;
  product_category?: string;
  commission_type: CommissionType;
  percentage_rate?: number;
  flat_rate?: number;
  min_amount?: number;
  max_amount?: number;
  tier_rules?: TierRule[];
  is_active: boolean;
  effective_from: string;
  effective_until?: string;
  created_at: string;
  updated_at: string;
  // Relations
  shop?: Shop;
  product?: Product;
}

export interface TierRule {
  min_quantity: number;
  max_quantity?: number;
  commission_rate: number;
}

export interface Commission {
  id: string;
  transaction_id: string;
  shop_id: string;
  farmer_id: string;
  rule_id: string;
  amount: number;
  rate: number;
  status: CommissionStatus;
  confirmed_by?: string;
  confirmed_at?: string;
  paid_at?: string;
  dispute_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relations
  transaction?: Transaction;
  shop?: Shop;
  farmer?: User;
  rule?: CommissionRule;
  confirmed_by_user?: User;
}

export interface CreateCommissionRuleRequest {
  shop_id: string;
  product_id?: string;
  product_category?: string;
  commission_type: CommissionType;
  percentage_rate?: number;
  flat_rate?: number;
  min_amount?: number;
  max_amount?: number;
  tier_rules?: TierRule[];
  effective_from: string;
  effective_until?: string;
}

export interface UpdateCommissionRuleRequest {
  commission_type?: CommissionType;
  percentage_rate?: number;
  flat_rate?: number;
  min_amount?: number;
  max_amount?: number;
  tier_rules?: TierRule[];
  is_active?: boolean;
  effective_until?: string;
}

export interface CommissionCalculation {
  base_amount: number;
  commission_rate: number;
  commission_amount: number;
  rule_applied: string;
  breakdown?: {
    tier: string;
    quantity: number;
    rate: number;
    amount: number;
  }[];
}

export interface CommissionSummary {
  total_pending: number;
  total_confirmed: number;
  total_paid: number;
  total_disputed: number;
  total_amount_pending: number;
  total_amount_confirmed: number;
  total_amount_paid: number;
  this_month_earned: number;
}

export interface CommissionFilter {
  shop_id?: string;
  farmer_id?: string;
  transaction_id?: string;
  status?: CommissionStatus;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
}
