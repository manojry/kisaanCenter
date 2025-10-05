import React from 'react';
import { Input } from '../components/ui/input';
import { UserSearchDropdown } from '../components/ui/UserSearchDropdown';

interface TransactionFiltersProps {
  filters: { search: string; from_date: string; to_date: string };
  setFilters: React.Dispatch<React.SetStateAction<{ search: string; from_date: string; to_date: string }>>;
  setSelectedUser: (v: string) => void;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  filters,
  setFilters,
  setSelectedUser,
}) => (
  <div className="flex flex-wrap gap-2 items-center">
    <div className="flex items-center w-full sm:w-auto">
      <div className="relative flex-1 min-w-0">
        <Input
          placeholder="Search"
          value={filters.search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          className="pl-10 text-sm w-full sm:w-64"
        />
      </div>
      <div className="ml-2 w-56">
        <UserSearchDropdown
          onSelect={user => setSelectedUser(user ? String(user.id) : '')}
          placeholder="Search and select user"
        />
      </div>
    </div>
    <div className="flex gap-2 items-center">
      <Input
        type="date"
        placeholder="From date"
        value={filters.from_date}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, from_date: e.target.value }))}
        className="text-sm w-32"
      />
      <span className="text-xs text-gray-500">to</span>
      <Input
        type="date"
        placeholder="To date"
        value={filters.to_date}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, to_date: e.target.value }))}
        className="text-sm w-32"
      />
    </div>
  </div>
);
