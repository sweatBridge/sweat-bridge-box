import { useCallback, useState } from 'react';
import { AdminClassService } from '../services/adminClassService';
import { AdminBoxClassStatus } from '../types/adminClass';

interface AdminClassStatusState {
  boxes: AdminBoxClassStatus[];
  failedBoxNames: string[];
  loading: boolean;
  error: string | null;
}

export const useAdminClassStatus = () => {
  const [state, setState] = useState<AdminClassStatusState>({
    boxes: [],
    failedBoxNames: [],
    loading: false,
    error: null,
  });

  const loadDailyStatus = useCallback(async (date: Date) => {
    setState((prev) => ({ ...prev, loading: true, error: null, failedBoxNames: [] }));
    try {
      const result = await AdminClassService.getDailyStatus(date);
      setState({ ...result, loading: false, error: null });
    } catch {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: '수업 등록 현황을 불러오지 못했습니다.',
      }));
    }
  }, []);

  return {
    ...state,
    loadDailyStatus,
  };
};
