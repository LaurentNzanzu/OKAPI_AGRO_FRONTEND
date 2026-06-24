import React, { createContext, useContext, useState, useCallback } from 'react';

const PageActionsContext = createContext(null);

export const PageActionsProvider = ({ children }) => {
  const [actions, setActions] = useState({ onExport: null, onPrint: null });

  const registerActions = useCallback(({ onExport, onPrint } = {}) => {
    setActions({
      onExport: onExport || null,
      onPrint: onPrint || null,
    });
  }, []);

  const clearActions = useCallback(() => {
    setActions({ onExport: null, onPrint: null });
  }, []);

  return (
    <PageActionsContext.Provider
      value={{
        onExport: actions.onExport,
        onPrint: actions.onPrint,
        registerActions,
        clearActions,
      }}
    >
      {children}
    </PageActionsContext.Provider>
  );
};

export const usePageActions = () => {
  const ctx = useContext(PageActionsContext);
  if (!ctx) {
    throw new Error('usePageActions must be used within PageActionsProvider');
  }
  return ctx;
};

export default PageActionsContext;
