import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import type { AppDispatch } from 'store';
import type { RootState } from 'store/rootReducer';
import { fetchExercices, setSelectedYear } from 'components/exercices/exercice.slice';

/**
 * Exercice (fiscal year) selector shown in the header for every role.
 * Loads the exercices once; the slice defaults the selection to the current exercice.
 */
export default function ExerciceSelect() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { list, current, selectedYear, loading } = useSelector((s: RootState) => s.exercice);

  useEffect(() => {
    dispatch(fetchExercices());
  }, [dispatch]);

  // If a previously persisted year no longer exists, fall back to the current exercice.
  useEffect(() => {
    if (!loading && list.length && selectedYear != null && !list.some((e) => e.year === selectedYear)) {
      dispatch(setSelectedYear(current?.year ?? null));
    }
  }, [loading, list, selectedYear, current, dispatch]);

  const years = useMemo(() => [...new Set(list.map((e) => e.year))].sort((a, b) => b - a), [list]);
  const value = selectedYear ?? current?.year ?? '';

  return (
    <label className="flex items-center gap-2 text-sm text-white/85">
      <span className="hidden sm:inline">{t('exercice.label')}</span>
      <select
        value={value}
        onChange={(e) => dispatch(setSelectedYear(Number(e.target.value)))}
        disabled={years.length === 0}
        className="h-8 w-[5.5rem] cursor-pointer rounded-xs border border-white/40 bg-band-strong px-2 sm:w-auto text-sm font-medium text-white tabular-nums focus-visible:outline-3 focus-visible:outline-focus"
      >
        {years.length === 0 && <option value="">—</option>}
        {years.map((y) => (
          <option key={y} value={y} className="bg-surface text-fg">
            {y}
            {current?.year === y ? ` (${t('exercice.current')})` : ''}
          </option>
        ))}
      </select>
    </label>
  );
}
