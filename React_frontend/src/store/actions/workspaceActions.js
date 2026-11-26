import { createAction, createAsyncThunk } from '@reduxjs/toolkit';
import { readResourceResponse } from '../api/resourceResponse.js';

export const readWorkspace = createAsyncThunk('workspace/read', readResourceResponse);
export const invalidateWorkspace = createAction('workspace/invalidate');
