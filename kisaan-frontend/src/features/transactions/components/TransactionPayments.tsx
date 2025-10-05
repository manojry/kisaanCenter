import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface PaymentState {
  buyerPaid: number;
  farmerPaid: number;
  commissionReceived: number;
  buyerPaymentMethod: 'CASH' | 'BANK' | 'UPI' | 'OTHER';
  farmerPaymentMethod: 'CASH' | 'BANK' | 'UPI' | 'OTHER';
}

interface Props extends PaymentState {
  onChange: (patch: Partial<PaymentState>) => void;
}

export const TransactionPayments: React.FC<Props> = ({ buyerPaid, farmerPaid, commissionReceived, buyerPaymentMethod, farmerPaymentMethod, onChange }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 mt-4">
      <div>
        <Label>Buyer Paid (to Shop)</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={buyerPaid === 0 ? '' : buyerPaid}
          onChange={e => onChange({ buyerPaid: e.target.value === '' ? 0 : Number(Number(e.target.value).toFixed(2)) })}
          className="text-sm"
        />
        <Label className="mt-1">Buyer → Shop Payment Method</Label>
        <select
          className="block w-full border rounded p-2 text-xs sm:text-sm mt-1"
          value={buyerPaymentMethod}
          onChange={e => onChange({ buyerPaymentMethod: e.target.value as 'CASH' | 'BANK' | 'UPI' | 'OTHER' })}
        >
          <option value="CASH">Cash</option>
          <option value="UPI">UPI</option>
          <option value="BANK">Bank</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
      <div>
        <Label>Farmer Paid (by Shop)</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={farmerPaid === 0 ? '' : farmerPaid}
          onChange={e => onChange({ farmerPaid: e.target.value === '' ? 0 : Number(Number(e.target.value).toFixed(2)) })}
          className="text-sm"
        />
        <Label className="mt-1">Shop → Farmer Payment Method</Label>
        <select
          className="block w-full border rounded p-2 text-xs sm:text-sm mt-1"
          value={farmerPaymentMethod}
          onChange={e => onChange({ farmerPaymentMethod: e.target.value as 'CASH' | 'BANK' | 'UPI' | 'OTHER' })}
        >
          <option value="CASH">Cash</option>
          <option value="UPI">UPI</option>
          <option value="BANK">Bank</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
      <div>
        <Label>Commission Received</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={commissionReceived === 0 ? '' : commissionReceived}
          onChange={e => onChange({ commissionReceived: e.target.value === '' ? 0 : Number(Number(e.target.value).toFixed(2)) })}
          className="text-sm"
        />
      </div>
      <p className="text-xs text-gray-500 mt-2 md:col-span-2">You can edit payment values and methods before creating the transaction.</p>
    </div>
  );
};
