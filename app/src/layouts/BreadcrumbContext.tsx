import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbContextValue {
  items: BreadcrumbItem[];
  setItems: (items: BreadcrumbItem[]) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BreadcrumbItem[]>([]);
  const value = useMemo(() => ({ items, setItems }), [items]);
  return <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>;
}

// oxlint-disable-next-line react/only-export-components -- hook belongs next to its context, fast-refresh-only concern
export function useBreadcrumbContext(): BreadcrumbContextValue {
  const ctx = useContext(BreadcrumbContext);
  if (!ctx) throw new Error('useBreadcrumbContext must be used within a BreadcrumbProvider');
  return ctx;
}

/**
 * Registers this page's real ancestor-name breadcrumb trail while it's
 * mounted. Pass null while the page's own data is still loading - Breadcrumbs
 * falls back to its generic URL-derived trail whenever no page has registered
 * one, which covers both list pages (which never call this) and the brief
 * loading window before a detail page's data resolves.
 */
// oxlint-disable-next-line react/only-export-components -- hook belongs next to its context, fast-refresh-only concern
export function useSetBreadcrumb(items: BreadcrumbItem[] | null): void {
  const { setItems } = useBreadcrumbContext();
  const key = JSON.stringify(items);
  useEffect(() => {
    setItems(items ?? []);
    return () => setItems([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when the serialized items actually change, not on every render
  }, [key]);
}
