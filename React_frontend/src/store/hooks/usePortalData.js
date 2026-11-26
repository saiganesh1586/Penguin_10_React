import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getRuntimeHelpers } from '../api/portalRepository.js';
import { saveAccountPreferences, selectPreferenceStatus, selectSession } from '../slices/authSlice.js';

export default function usePortalData(slice, page, pageProps, actions, runtime) {
  const dispatch = useDispatch();
  const state = useSelector(rootState => rootState[slice.name]);
  const account = useSelector(rootState => page === 'settings' ? selectSession(rootState) : null);
  const preferenceStatus = useSelector(rootState =>
    page === 'settings' ? selectPreferenceStatus(rootState) : null
  );
  const loadData = slice.actions.loadData;
  const lastRevision = useRef(state.revision);

  useEffect(() => {
    const force = lastRevision.current !== state.revision;
    lastRevision.current = state.revision;
    const request = dispatch(loadData({ page, pageProps, force }));
    return () => request.abort();
  }, [dispatch, loadData, page, pageProps, state.revision]);

  const retry = useCallback(
    () => dispatch(loadData({ page, pageProps, force: true })),
    [dispatch, loadData, page, pageProps]
  );
  const data = state.page === page && state.data
    ? { ...getRuntimeHelpers(runtime, state.data), ...state.data, actions }
    : null;
  if (data && page === 'settings' && account) {
    const { token, ...safeAccount } = account;
    data.CU = { ...data.CU, ...safeAccount, phone: safeAccount.phoneNo ?? safeAccount.phone };
    data.preferenceControls = {
      pending: Boolean(preferenceStatus.requestId),
      error: preferenceStatus.error,
      onSave: async preferences => {
        const action = await dispatch(saveAccountPreferences(preferences));
        if (saveAccountPreferences.fulfilled.match(action)) window.EventFlowData?.invalidate();
      },
    };
  }
  return { data, loading: state.loading, error: state.error, retry };
}
