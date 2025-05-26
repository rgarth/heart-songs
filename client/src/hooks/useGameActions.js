// client/src/hooks/useGameActions.js - Fixed race condition prevention
import { useState, useCallback, useRef } from 'react';

export const useGameActions = () => {
  const [pendingActions, setPendingActions] = useState(new Set());
  const [actionErrors, setActionErrors] = useState({});
  const abortControllersRef = useRef(new Map());
  
  // Use a ref to track pending actions synchronously
  const pendingActionsRef = useRef(new Set());

  const executeAction = useCallback(async (actionName, actionFn, options = {}) => {
    const { 
      preventDuplicates = true, 
      timeout = 30000,
      onSuccess,
      onError 
    } = options;

    // Check ref for immediate synchronous duplicate prevention
    if (preventDuplicates && pendingActionsRef.current.has(actionName)) {
      console.warn(`Action ${actionName} already in progress (blocked by ref)`);
      return null;
    }

    // Also check state for consistency
    if (preventDuplicates && pendingActions.has(actionName)) {
      console.warn(`Action ${actionName} already in progress (blocked by state)`);
      return null;
    }

    // Clear any previous error for this action
    setActionErrors(prev => {
      const next = { ...prev };
      delete next[actionName];
      return next;
    });

    // Add to pending actions immediately in both ref and state
    pendingActionsRef.current.add(actionName);
    setPendingActions(prev => new Set([...prev, actionName]));

    // Create abort controller for timeout
    const abortController = new AbortController();
    abortControllersRef.current.set(actionName, abortController);

    // Set up timeout
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, timeout);

    try {
      const result = await actionFn(abortController.signal);
      
      clearTimeout(timeoutId);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Don't show error if action was aborted (user navigated away, etc.)
      if (!abortController.signal.aborted) {
        const errorMessage = error.message || 'Action failed';
        
        setActionErrors(prev => ({
          ...prev,
          [actionName]: errorMessage
        }));

        if (onError) {
          onError(error);
        }
      }
      
      throw error;
    } finally {
      // Clean up both ref and state
      pendingActionsRef.current.delete(actionName);
      setPendingActions(prev => {
        const next = new Set(prev);
        next.delete(actionName);
        return next;
      });
      
      abortControllersRef.current.delete(actionName);
    }
  }, [pendingActions]);

  const cancelAction = useCallback((actionName) => {
    const controller = abortControllersRef.current.get(actionName);
    if (controller) {
      controller.abort();
    }
  }, []);

  const clearError = useCallback((actionName) => {
    setActionErrors(prev => {
      const next = { ...prev };
      delete next[actionName];
      return next;
    });
  }, []);

  return {
    executeAction,
    cancelAction,
    clearError,
    isPending: useCallback((actionName) => {
      // Check both ref and state for consistency
      return pendingActionsRef.current.has(actionName) || pendingActions.has(actionName);
    }, [pendingActions]),
    getError: useCallback((actionName) => actionErrors[actionName], [actionErrors]),
    pendingActions: Array.from(pendingActions)
  };
};