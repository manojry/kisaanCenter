

import { useState } from 'react';
import { useNotifications, useLoading } from '../context/AppStateContext';
import { useOfflineSupport } from '../components/useOfflineSupport';

type ApiCallOptions = {
	offlineType?: string;
	offlineData?: any;
	notifySuccess?: { title: string; message: string };
	notifyError?: { title: string; message: string };
};

export function useApiCall<T = any>() {
	const { addNotification } = useNotifications();
	const { setLoading } = useLoading();
	const { queueAction } = useOfflineSupport();
	const [data, setData] = useState<T | null>(null);
	const [error, setError] = useState<string | null>(null);

	const callApi = async (
		apiFn: () => Promise<T>,
		options?: ApiCallOptions
	) => {
		setLoading('apiCall', true);
		setError(null);

		try {
			const result = await apiFn();
			setData(result);

			if (options?.notifySuccess) {
				addNotification({
					type: 'success',
					title: options.notifySuccess.title,
					message: options.notifySuccess.message,
				});
			}
			return result;
		} catch (err: any) {
			setError(err?.message || 'Unknown error');
			if (options?.notifyError) {
				addNotification({
					type: 'error',
					title: options.notifyError.title,
					message: options.notifyError.message,
				});
			}
			// Optionally queue offline action
			if (options?.offlineType && options?.offlineData) {
				queueAction(options.offlineType, options.offlineData);
			}
			throw err;
		} finally {
			setLoading('apiCall', false);
		}
	};

	return { data, error, callApi };
}
