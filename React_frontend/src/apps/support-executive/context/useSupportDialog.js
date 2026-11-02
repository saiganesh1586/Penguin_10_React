import { useCallback, useEffect, useState } from 'react';

// The adapter preserves the existing reply, attachment and status-update workflow.
export default function useSupportDialog(user, getOptions, refresh, onBack) {
  const [container, setContainer] = useState(null);
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    if (!container) return;
    const nextDialog = window.EventFlowSupport.bind(container, user, onBack, 'Back to Dashboard', {
      ...getOptions(),
      management: true,
      nativeView: true,
      onRefresh: refresh,
    });
    setDialog(nextDialog);
    return () => nextDialog?.destroy();
  }, [container, user, getOptions, refresh, onBack]);

  const openTicket = useCallback(ticket => dialog?.openTicket(ticket), [dialog]);
  return { setContainer, openTicket, ready: Boolean(dialog) };
}
