import { useState, useCallback } from 'react';
import { BoxInfo, BoxState } from '../types/box';
import { BoxService } from '../services/boxService';
import { useAuth } from '../contexts/AuthContext';

export const useBoxManagement = () => {
  const { user } = useAuth();
  const [state, setState] = useState<BoxState>({
    loading: false,
    error: null,
    boxInfo: null
  });

  /**
   * 박스 정보 로드
   */
  const loadBoxInfo = useCallback(async () => {
    if (!user?.boxName) {
      setState(prev => ({ ...prev, error: '박스 이름이 없습니다.' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const boxInfo = await BoxService.getBoxInfo(user.boxName);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        boxInfo: boxInfo || {
          boxName: user.boxName,
          email: user.email || '',
          representative: '',
          phone: '',
          address: {
            zoneCode: '',
            roadAddress: '',
            detailAddress: ''
          },
          description: '',
          coaches: []
        }
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : '박스 정보를 불러오는데 실패했습니다.' 
      }));
    }
  }, [user]);

  /**
   * 박스 정보 업데이트
   */
  const updateBoxInfo = useCallback(async (boxInfo: BoxInfo) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await BoxService.updateBoxInfo(boxInfo);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        boxInfo 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : '박스 정보 수정에 실패했습니다.' 
      }));
      throw error;
    }
  }, []);

  /**
   * 에러 클리어
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    boxInfo: state.boxInfo,
    loading: state.loading,
    error: state.error,
    loadBoxInfo,
    updateBoxInfo,
    clearError
  };
}; 