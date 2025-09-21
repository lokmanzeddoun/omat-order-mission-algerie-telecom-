import { Autocomplete, TextField } from '@mui/material';
import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from 'store';
import { RootState } from 'store/rootReducer';
import { fetchExercices, setSelectedYear, type Exercice as ExerciceType } from './exercice.slice';

const ExerciceSelector = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { list, selectedYear, current } = useSelector((s: RootState) => s.exercice as any);

    useEffect(() => {
        dispatch(fetchExercices());
    }, [dispatch]);

    const yearsAll: number[] = useMemo(() => {
        const arr = Array.from(new Set<number>((list as ExerciceType[] | undefined)?.map((e) => e.year) ?? []));
        return (arr as number[]).sort((a: number, b: number) => b - a);
    }, [list]);

    const value: number | null = selectedYear ?? current?.year ?? null;

    const filterOptions = (options: readonly number[], params: { inputValue: string }) => {
        const q = (params.inputValue || '').trim().toLowerCase();
        if (!q) {
            // Default view: only latest three years if available
            return [...options].slice(0, 3);
        }
        return [...options].filter((y) => y.toString().toLowerCase().includes(q));
    };

    return (
        <Autocomplete<number, false, true, false>
            size="small"
            disableClearable
            sx={{ minWidth: 160 }}
            options={yearsAll}
            value={value == null ? undefined : value}
            onChange={(_, newValue) => dispatch(setSelectedYear(newValue ?? null))}
            filterOptions={filterOptions}
            autoHighlight
            isOptionEqualToValue={(option, val) => option === val}
            getOptionLabel={(y) => (y ? y.toString() : '')}
            renderInput={(params) => (
                <TextField
                    {...params}
                    variant="outlined"
                    placeholder={value == null ? 'Année' : ''}
                    sx={{
                        '& .MuiInputBase-input': {
                            py: 0.6,
                            textOverflow: 'clip',
                            overflow: 'visible',
                            fontVariantNumeric: 'tabular-nums',
                        },
                    }}
                />
            )}
            renderOption={(props, option) => (
                <li {...props} key={option}>{option}</li>
            )}
        />
    );
};

export default ExerciceSelector;
