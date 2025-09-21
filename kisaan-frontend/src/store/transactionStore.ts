import { create } from 'zustand';
import type { Transaction } from '../types/api';

interface TransactionState {
  transactionsByShopAndDate: Record<string, Record<string, Transaction[]>>;
  usersByShop: Record<string, any[]>;
  shop: any | null;
  setShop: (shop: any) => void;
  getShop: () => any | null;
  setTransactions: (shopId: string, date: string, txns: Transaction[]) => void;
  getTransactions: (shopId: string, dates: string[]) => Transaction[];
  setUsers: (shopId: string, users: any[]) => void;
  getUsers: (shopId: string) => any[];
  clearStore: () => void;
  invalidateTransactions: (shopId: string, dates: string[]) => void;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactionsByShopAndDate: {},
  usersByShop: {},
  shop: null,
  setShop: (shop) => set({ shop }),
  getShop: () => get().shop,
  setTransactions: (shopId, date, txns) => set(state => ({
    transactionsByShopAndDate: {
      ...state.transactionsByShopAndDate,
      [shopId]: {
        ...(state.transactionsByShopAndDate[shopId] || {}),
        [date]: txns
      }
    }
  })),
  getTransactions: (shopId, dates) => {
    const shopData = get().transactionsByShopAndDate[shopId] || {};
    return dates.flatMap(date => shopData[date] || []);
  },
  setUsers: (shopId, users) => set(state => ({
    usersByShop: {
      ...state.usersByShop,
      [shopId]: users
    }
  })),
  getUsers: (shopId) => get().usersByShop[shopId] || [],
  clearStore: () => set({ transactionsByShopAndDate: {}, usersByShop: {} }),
  invalidateTransactions: (shopId: string, dates: string[]) => set(state => {
    const updated = { ...state.transactionsByShopAndDate };
    if (updated[shopId]) {
      dates.forEach(date => {
        if (updated[shopId][date]) {
          delete updated[shopId][date];
        }
      });
    }
    return { transactionsByShopAndDate: updated };
  })
}));
