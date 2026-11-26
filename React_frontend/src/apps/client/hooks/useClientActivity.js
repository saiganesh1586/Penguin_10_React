import { useCallback, useEffect } from 'react';
import { createSelector } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { clientActivityQuery, loadClientActivity } from '../api/client-api.js';
import { selectResourceQuery } from '../../../store/slices/resourcesSlice.js';

const selectActivityRows = createSelector(
  state => selectResourceQuery(state, 'activityLogs', clientActivityQuery),
  response => [...(Array.isArray(response) ? response : response?.logs || [])].sort((left, right) => {
    const difference =
      new Date(right.timestamp || right.createdAt || 0) -
      new Date(left.timestamp || left.createdAt || 0);
    return difference || String(right.id || '').localeCompare(String(left.id || ''));
  })
);

export default function useClientActivity(refreshKey) {
  const dispatch = useDispatch();
  const rows = useSelector(selectActivityRows);
  const loading = useSelector(state => Boolean(state.resources.activityLogs.pending[clientActivityQuery]));
  const error = useSelector(state => state.resources.activityLogs.errors[clientActivityQuery] || '');
  const refreshToken =
    typeof refreshKey === 'string' || typeof refreshKey === 'number' ? refreshKey : null;

  useEffect(() => {
    const request = dispatch(loadClientActivity());
    return () => request?.abort();
  }, [dispatch, refreshToken]);

  const retry = useCallback(() => {
    dispatch(loadClientActivity());
  }, [dispatch]);
  return { rows, loading, error, retry };
}
