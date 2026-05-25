import { useState, useCallback } from 'react';
import { BoxInfo, BoxStatus } from '../types/box';
import { AdminBoxRepository } from '../repositories';

interface AdminBoxesState {
  boxes: BoxInfo[];
  loading: boolean;
  error: string | null;
}

export const useAdminBoxes = () => {
  const [state, setState] = useState<AdminBoxesState>({
    boxes: [],
    loading: false,
    error: null,
  });

  const loadBoxes = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const boxes = await AdminBoxRepository.listAllBoxes();
      setState({ boxes, loading: false, error: null });
    } catch (e) {
      setState((prev) => ({ ...prev, loading: false, error: '박스 목록을 불러오지 못했습니다.' }));
    }
  }, []);

  const updateBoxStatus = useCallback(async (boxName: string, status: BoxStatus) => {
    await AdminBoxRepository.updateBoxStatus(boxName, status);
    setState((prev) => ({
      ...prev,
      boxes: prev.boxes.map((b) => b.boxName === boxName ? { ...b, status } : b),
    }));
  }, []);

  return {
    boxes: state.boxes,
    loading: state.loading,
    error: state.error,
    loadBoxes,
    updateBoxStatus,
  };
};
