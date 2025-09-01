import { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface OfflineAction {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

export const useOfflineSupport = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useLocalStorage<OfflineAction[]>('offline_actions', []);
  const [syncInProgress, setSyncInProgress] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const queueAction = (type: string, data: any) => {
    const action: OfflineAction = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0
    };

    setPendingActions((prev: OfflineAction[]) => [...prev, action]);
    
    if (isOnline) {
      syncPendingActions();
    }
  };

  const syncPendingActions = async () => {
    if (syncInProgress || pendingActions.length === 0) return;

    setSyncInProgress(true);
    const actionsToSync = [...pendingActions];
    const successfulActions: string[] = [];

    for (const action of actionsToSync) {
      try {
        // Attempt to sync action
        await syncAction(action);
        successfulActions.push(action.id);
      } catch (error) {
        console.error(`Failed to sync action ${action.id}:`, error);
        
        // Increment retry count
        action.retryCount += 1;
        
        // Remove action if max retries reached
        if (action.retryCount >= 3) {
          successfulActions.push(action.id);
          console.warn(`Removing action ${action.id} after 3 failed attempts`);
        }
      }
    }

    // Remove successful actions
    setPendingActions((prev: OfflineAction[]) => 
      prev.filter((action: OfflineAction) => !successfulActions.includes(action.id))
    );

    setSyncInProgress(false);
  };

  const syncAction = async (action: OfflineAction) => {
    // Implement actual API calls based on action type
    switch (action.type) {
      case 'CREATE_TRANSACTION':
        // await apiClient.post('/transactions', action.data);
        break;
      case 'UPDATE_PAYMENT':
        // await apiClient.put(`/payments/${action.data.id}`, action.data);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  };

  return {
    isOnline,
    pendingActions: pendingActions.length,
    syncInProgress,
    queueAction,
    syncPendingActions
  };
};
