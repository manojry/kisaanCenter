import React from 'react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import SettlementCard from './SettlementCard';
import SettlementDialog from './SettlementDialog';


import type { Settlement } from '../../types/api';

interface SettlementsTabProps {
  filterFromDate: string;
  setFilterFromDate: (v: string) => void;
  filterToDate: string;
  setFilterToDate: (v: string) => void;
  fetchData: () => void;
  fifoUserId: string;
  setFifoUserId: (v: string) => void;
  fifoAmount: string;
  setFifoAmount: (v: string) => void;
  handleFifoRepay: () => void;
  settlements: Settlement[];
  setSelectedSettlement: (s: Settlement | null) => void;
  selectedSettlement: Settlement | null;
  settleAmount: string;
  setSettleAmount: (v: string) => void;
  handleSettle: () => void;
  isLoading: boolean;
}

const SettlementsTab: React.FC<SettlementsTabProps> = ({
  filterFromDate,
  setFilterFromDate,
  filterToDate,
  setFilterToDate,
  fetchData,
  fifoUserId,
  setFifoUserId,
  fifoAmount,
  setFifoAmount,
  handleFifoRepay,
  settlements,
  setSelectedSettlement,
  selectedSettlement,
  settleAmount,
  setSettleAmount,
  handleSettle,
  isLoading
}) => (
  <div className="space-y-4">
    <h2 className="text-xl font-semibold">All Settlements</h2>
    {/* Filter controls */}
    <div className="flex flex-wrap gap-2 mb-4">
      <Input type="date" value={filterFromDate} onChange={e => setFilterFromDate(e.target.value)} placeholder="From date" />
      <Input type="date" value={filterToDate} onChange={e => setFilterToDate(e.target.value)} placeholder="To date" />
      <Button size="sm" onClick={fetchData}>Filter Income</Button>
    </div>
    {/* FIFO Repayment Form */}
    <Card className="mb-4">
      <CardHeader><CardTitle>FIFO Repayment</CardTitle></CardHeader>
      <CardContent className="flex gap-2 items-end">
        <Input type="text" value={fifoUserId} onChange={e => setFifoUserId(e.target.value)} placeholder="User ID" />
        <Input type="number" value={fifoAmount} onChange={e => setFifoAmount(e.target.value)} placeholder="Amount" />
        <Button size="sm" onClick={handleFifoRepay} aria-label="Repay FIFO" disabled={!fifoUserId || !fifoAmount || isLoading}>Repay</Button>
      </CardContent>
    </Card>
    {settlements.map((settlement) => (
      <SettlementCard key={settlement.id} settlement={settlement} onSettle={() => setSelectedSettlement(settlement)} />
    ))}
    {/* Settlement Dialog */}
    {selectedSettlement && (
      <SettlementDialog
        selectedSettlement={selectedSettlement}
        settleAmount={settleAmount}
        setSettleAmount={setSettleAmount}
        onSettle={handleSettle}
        onCancel={() => setSelectedSettlement(null)}
        isLoading={isLoading}
      />
    )}
  </div>
);

export default SettlementsTab;