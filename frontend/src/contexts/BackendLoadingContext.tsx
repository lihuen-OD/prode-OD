import React, { createContext, useContext, useState, useCallback } from 'react';

type BackendLoadingContextValue = {
  isLoading: boolean;
  setLoading: (v: boolean) => void;
  showMessage: (msg: string) => void;
  message: string | null;
};

const BackendLoadingContext = createContext<BackendLoadingContextValue | null>(null);

export const BackendLoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const setLoading = useCallback((v: boolean) => {
    setIsLoading(v);
    if (!v) setMessage(null);
  }, []);

  const showMessage = useCallback((msg: string) => setMessage(msg), []);

  // expose simple window API so non-react modules can toggle loader (apiClient)
  React.useEffect(() => {
    // @ts-ignore
    window.__backend_set_loading__ = (v: boolean) => setLoading(Boolean(v));
    // @ts-ignore
    window.__backend_show_message__ = (s: string) => showMessage(String(s));
    return () => {
      // @ts-ignore
      delete window.__backend_set_loading__;
      // @ts-ignore
      delete window.__backend_show_message__;
    };
  }, [setLoading, showMessage]);

  return (
    <BackendLoadingContext.Provider value={{ isLoading, setLoading, showMessage, message }}>
      {children}
    </BackendLoadingContext.Provider>
  );
};

export function useBackendLoading() {
  const ctx = useContext(BackendLoadingContext);
  if (!ctx) throw new Error('useBackendLoading must be used within BackendLoadingProvider');
  return ctx;
}

export default BackendLoadingContext;
