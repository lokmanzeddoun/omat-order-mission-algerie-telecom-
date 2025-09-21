import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import http from 'helpers/http';
import { RootState } from 'store/rootReducer';

export interface Exercice {
    id: number;
    year: number;
    isCurrent: boolean;
    start?: string | null;
    end?: string | null;
}

export interface ExerciceState {
    list: Exercice[];
    current: Exercice | null;
    selectedYear: number | null; // when null, implies current
    loading: boolean;
    error?: string | null;
}

const initialState: ExerciceState = {
    list: [],
    current: null,
    selectedYear: null,
    loading: false,
    error: null,
};

export const fetchExercices = createAsyncThunk(
    'exercice/fetchAll',
    async (_: void, { getState }) => {
        const state = getState() as RootState;
        const token = (state as any)?.auth?.token ?? null;
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const [listRes, currentRes] = await Promise.all([
            http.get<Exercice[]>('/exercices', { headers }),
            http.get<Exercice | null>('/exercices/current', { headers }),
        ]);
        return { list: listRes.data ?? [], current: currentRes.data ?? null };
    },
);

const exerciceSlice = createSlice({
    name: 'exercice',
    initialState,
    reducers: {
        setSelectedYear(state, action: PayloadAction<number | null>) {
            state.selectedYear = action.payload;
        },
    },
    extraReducers(builder) {
        builder
            .addCase(fetchExercices.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchExercices.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload.list;
                state.current = action.payload.current;
                // Default selectedYear to current if none set
                if (state.selectedYear == null && action.payload.current) {
                    state.selectedYear = action.payload.current.year;
                }
            })
            .addCase(fetchExercices.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message ?? 'Failed to load exercices';
            });
    },
});

export const { setSelectedYear } = exerciceSlice.actions;
export default exerciceSlice.reducer;
