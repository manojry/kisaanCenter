import { useCallback, useState } from 'react';

/**
 * Generic form state manager.
 * Returns value, setters, change handler factory, reset and patch helpers.
 */
export function useFormState<T extends Record<string, any>>(initial: T) {
  const [values, setValues] = useState<T>(initial);

  const setField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleChange = useCallback(<K extends keyof T>(key: K) => (value: any | React.ChangeEvent<any>) => {
    const next = (value && value.target) ? (value.target as HTMLInputElement).value : value;
    setField(key, next as T[K]);
  }, [setField]);

  const patch = useCallback((obj: Partial<T>) => {
    setValues(prev => ({ ...prev, ...obj }));
  }, []);

  const reset = useCallback(() => setValues(initial), [initial]);

  return { values, setField, handleChange, patch, reset, setValues };
}

export default useFormState;
