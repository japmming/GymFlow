import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  getDashboard,
  getEvents,
  getMembers,
  getMemberships,
  getPayments,
} from '../../services/api';

import type { DashboardSummary } from '../../types/dashboard';
import type { GymEvent } from '../../types/event';
import type { Member } from '../../types/member';
import type { Membership } from '../../types/membership';
import type { Payment } from '../../types/payment';

interface DashboardData {
  summary: DashboardSummary;
  payments: Payment[];
  memberships: Membership[];
  members: Member[];
  events: GymEvent[];
}

interface DashboardContextValue {
  data: DashboardData | null;
  loading: boolean;
  refreshing: boolean;
  error: string;
  refresh: (mode?: 'initial' | 'refresh') => Promise<void>;
}

const DashboardContext =
  createContext<DashboardContextValue | null>(null);

export function DashboardDataProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [data, setData] = useState<DashboardData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const activeRequest = useRef(0);

  const refresh = useCallback(
    async (mode: 'initial' | 'refresh' = 'refresh') => {
      const requestId = activeRequest.current + 1;
      activeRequest.current = requestId;

      try {
        if (mode === 'initial') {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError('');

        const [
          summary,
          payments,
          memberships,
          members,
          events,
        ] = await Promise.all([
          getDashboard(),
          getPayments(),
          getMemberships(),
          getMembers(),
          getEvents(),
        ]);

        if (activeRequest.current !== requestId) {
          return;
        }

        setData({
          summary,
          payments,
          memberships,
          members,
          events,
        });
      } catch (err) {
        if (activeRequest.current !== requestId) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : 'No se pudo cargar la información del gimnasio.',
        );
      } finally {
        if (activeRequest.current === requestId) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void refresh('initial');
  }, [refresh]);

  const value = useMemo(
    () => ({
      data,
      loading,
      refreshing,
      error,
      refresh,
    }),
    [data, loading, refreshing, error, refresh],
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardData(): DashboardContextValue {
  const context = useContext(DashboardContext);

  if (!context) {
    throw new Error(
      'useDashboardData debe usarse dentro de DashboardDataProvider.',
    );
  }

  return context;
}
