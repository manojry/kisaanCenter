import React, { useState } from 'react';
import LedgerList from './LedgerList';
import LedgerForm from './LedgerForm';
import LedgerSummary from './LedgerSummary';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { BookOpen, Plus } from 'lucide-react';

const SimpleLedger: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'entries' | 'summary'>('entries');
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  const handleEntryAdded = () => {
    setShowForm(false);
    setRefreshTrigger(!refreshTrigger);
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Simple Farmer Ledger</h1>
        </div>
        <p className="text-gray-600">Track credit and debit entries for farmers</p>
      </div>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as typeof activeTab)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="entries">Entries</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        {/* Entries Tab */}
        <TabsContent value="entries" className="mt-6 space-y-4">
          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          )}
          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Entry</CardTitle>
              </CardHeader>
              <CardContent>
                <LedgerForm onSuccess={handleEntryAdded} onCancel={() => setShowForm(false)} />
              </CardContent>
            </Card>
          )}
          <LedgerList refreshTrigger={refreshTrigger} />
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="mt-6">
          <LedgerSummary />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SimpleLedger;
