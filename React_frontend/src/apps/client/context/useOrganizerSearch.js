import { useCallback, useState } from 'react';

export default function useOrganizerSearch() {
  const [filters, setFilters] = useState(() =>
    Object.fromEntries(
      ['q', 'rating', 'category', 'city', 'pricing'].map(field => [
        field,
        sessionStorage.getItem(`search_org_${field}`) || (field === 'q' ? '' : 'all'),
      ])
    )
  );

  const updateFilter = useCallback((field, value) => {
    sessionStorage.setItem(`search_org_${field}`, value);
    setFilters(current => ({ ...current, [field]: value }));
  }, []);

  return { filters, updateFilter };
}
