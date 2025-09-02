
import React from 'react';
import { useOfflineSupport } from '../hooks/useOfflineSupport';
import { useNotifications } from '../context/AppStateContext';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

const TransactionOfflineHandler: React.FC = () => {
  const { isOnline, pendingActions, syncInProgress, syncPendingActions } = useOfflineSupport();
  const { addNotification } = useNotifications();

  React.useEffect(() => {
    if (isOnline && pendingActions > 0) {
      addNotification({
        type: 'info',
        title: 'Back Online',
        message: `Syncing ${pendingActions} pending actions...`
      });
    }
  }, [isOnline, pendingActions, addNotification]);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg ${
        isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
        <span className="text-sm font-medium">
          {isOnline ? 'Online' : 'Offline'}
        </span>
        
        {pendingActions > 0 && (
          <>
            <span className="text-xs">•</span>
            <span className="text-xs">{pendingActions} pending</span>
            {isOnline && (
              <button
                onClick={syncPendingActions}
                disabled={syncInProgress}
                className="ml-2 p-1 hover:bg-white hover:bg-opacity-20 rounded"
              >
                <RefreshCw className={`h-3 w-3 ${syncInProgress ? 'animate-spin' : ''}`} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TransactionOfflineHandler;
