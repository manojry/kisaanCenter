import React from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import type { Settlement, User } from '../../types/api';
import { formatCurrency } from '../../lib/formatters';

interface SettlementCardProps {
	settlement: Settlement & { user?: User };
	onSettle: () => void;
}

const SettlementCard: React.FC<SettlementCardProps> = ({ settlement, onSettle }) => (
	<Card key={settlement.id}>
		<CardContent className="p-4">
			<div className="flex items-center justify-between mb-2">
				<div>
					<h3 className="font-semibold">{settlement.user?.username ?? 'Unknown'}</h3>
					<p className="text-sm text-muted-foreground">
						{'description' in settlement ? (settlement as { description?: string }).description : ''}
					</p>
				</div>
				<Badge variant={settlement.status === 'settled' ? 'default' : 'secondary'}>
					{settlement.status}
				</Badge>
			</div>
			<div className="flex items-center justify-between">
				<div className="text-sm">
					<span>Amount: {formatCurrency(settlement.amount)}</span>
					{'settled_amount' in settlement && (settlement as { settled_amount?: number }).settled_amount! > 0 && (
						<span className="ml-2 text-green-600">
							(Settled: {formatCurrency((settlement as { settled_amount?: number }).settled_amount ?? 0)})
						</span>
					)}
				</div>
				{(settlement.status === 'pending' && 'balance' in settlement && (settlement as { balance?: number }).balance! > 0) && (
					<Button size="sm" onClick={onSettle}>
						Settle
					</Button>
				)}
			</div>
		</CardContent>
	</Card>
);

export default SettlementCard;
