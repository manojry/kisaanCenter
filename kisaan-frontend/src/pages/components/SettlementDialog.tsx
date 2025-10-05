import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import type { Settlement, User } from '../../types/api';
import { formatCurrency } from '../../lib/formatters';

interface SettlementDialogProps {
	selectedSettlement: Settlement & { user?: User };
	settleAmount: string;
	setSettleAmount: (v: string) => void;
	onSettle: () => void;
	onCancel: () => void;
	isLoading: boolean;
}

const SettlementDialog: React.FC<SettlementDialogProps> = ({
	selectedSettlement,
	settleAmount,
	setSettleAmount,
	onSettle,
	onCancel,
	isLoading
}) => (
	<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle>Settle Amount</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div>
					<p className="text-sm text-muted-foreground mb-2">
						{selectedSettlement.user?.username ?? ''} - {('description' in selectedSettlement ? (selectedSettlement as { description?: string }).description : '')}
					</p>
					<p className="font-semibold">
						Outstanding: {formatCurrency('balance' in selectedSettlement ? (selectedSettlement as { balance?: number }).balance ?? 0 : 0)}
					</p>
				</div>
				<div>
					<Label htmlFor="settleAmount">Settlement Amount</Label>
					<Input
						id="settleAmount"
						type="number"
						placeholder="Enter amount received"
						value={settleAmount}
						onChange={(e) => setSettleAmount(e.target.value)}
					/>
				</div>
				<div className="flex gap-2">
					<Button onClick={onSettle} aria-label="Settle" disabled={!settleAmount || isLoading}>Settle</Button>
					<Button variant="outline" onClick={onCancel}>
						Cancel
					</Button>
				</div>
			</CardContent>
		</Card>
	</div>
);

export default SettlementDialog;
