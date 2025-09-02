import React from 'react';
import { useNotifications, useLoading } from '../context/AppStateContext';
import { useApiCall } from '../hooks/useApiCall';

const TestAppState: React.FC = () => {
  const { addNotification } = useNotifications();
  const { isLoading } = useLoading();
  const { callApi } = useApiCall();

  const testSuccess = () => {
    addNotification({
      type: 'success',
      title: 'Test Success',
      message: 'AppState is working perfectly!'
    });
  };

  const testError = () => {
    addNotification({
      type: 'error',
      title: 'Test Error',
      message: 'This is a test error notification'
    });
  };

  const testApiCall = async () => {
    await callApi(
      () => new Promise(resolve => setTimeout(() => resolve('API Success!'), 2000)),
      {
        notifySuccess: {
          title: 'API Success',
          message: 'Test API call completed successfully!'
        }
      }
    );
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Test AppState</h2>
      <div className="space-x-2">
        <button
          onClick={testSuccess}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Test Success
        </button>
        <button
          onClick={testError}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Test Error
        </button>
        <button
          onClick={testApiCall}
          disabled={isLoading('apiCall')}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isLoading('apiCall') ? 'Loading...' : 'Test API Call'}
        </button>
      </div>
    </div>
  );
};

export default TestAppState;
