import { useState, useCallback } from 'react';
import { RevenueState, DailyRevenue } from '../types/revenue';
import { RevenueService } from '../services/revenueService';

export const useRevenueManagement = () => {
  const [state, setState] = useState<RevenueState>({
    monthlyRevenue: null,
    stats: {
      totalRevenue: 0,
      thisMonthRevenue: 0,
      todayRevenue: 0,
      averageDailyRevenue: 0
    },
    loading: false,
    error: null
  });

  // 로딩 상태 설정
  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  // 에러 상태 설정
  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  // 에러 클리어
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // 월별 매출 데이터 로드
  const loadMonthlyRevenue = useCallback(async (year: number, month: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const monthlyRevenue = await RevenueService.getMonthlyRevenue(year, month);
      setState(prev => ({ ...prev, monthlyRevenue, loading: false }));
    } catch (error) {
      setError((error as Error).message);
      setLoading(false);
    }
  }, [setLoading, setError]);

  // 매출 통계 로드
  const loadRevenueStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const stats = await RevenueService.getRevenueStats();
      setState(prev => ({ ...prev, stats, loading: false }));
    } catch (error) {
      setError((error as Error).message);
      setLoading(false);
    }
  }, [setLoading, setError]);

  // 일별 매출 데이터 업데이트
  const updateDailyRevenue = useCallback(async (dailyRevenue: DailyRevenue) => {
    setLoading(true);
    setError(null);
    
    try {
      await RevenueService.updateDailyRevenue(dailyRevenue);
      // 현재 월 데이터 다시 로드
      if (state.monthlyRevenue) {
        await loadMonthlyRevenue(state.monthlyRevenue.year, state.monthlyRevenue.month);
      }
    } catch (error) {
      setError((error as Error).message);
      setLoading(false);
      throw error;
    }
  }, [setLoading, setError, loadMonthlyRevenue, state.monthlyRevenue]);

  return {
    monthlyRevenue: state.monthlyRevenue,
    stats: state.stats,
    loading: state.loading,
    error: state.error,
    loadMonthlyRevenue,
    loadRevenueStats,
    updateDailyRevenue,
    clearError
  };
}; 