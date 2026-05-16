import { useCallback } from 'react';
import { useClassContext } from '../contexts/ClassContext';
import { ClassService, ClassPayload } from '../services/classService';
import { SaveClassResult, UpdateClassResult, ClassEvent } from '../types/class';

export const useClassManagement = () => {
  const { state, dispatch } = useClassContext();

  // 날짜 범위별 수업 데이터 로드
  const loadMonthlyClasses = useCallback(async (startDate: Date, endDate: Date) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const classes = await ClassService.getMonthlyClasses(state.currentBox, startDate, endDate);
      dispatch({ type: 'SET_CLASSES', payload: classes });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    }
  }, [state.currentBox, dispatch]);

  // 새 수업 생성
  const createClass = useCallback(async (
    date: Date, 
    classData: SaveClassResult
  ): Promise<ClassEvent> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const docKey = ClassService.generateDocKey(date, classData.startTime, classData.endTime);
      
      const payload: ClassPayload = {
        docKey,
        box: state.currentBox,
        coach: classData.coach,
        cap: classData.cap,
      };

      await ClassService.setClass(payload);

      // 새로 생성된 이벤트 객체
      const newEvent: ClassEvent = {
        id: docKey,
        title: `${state.currentBox} WOD`,
        start: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${classData.startTime}:00+09:00`,
        end: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${classData.endTime}:00+09:00`,
        extendedProps: {
          coach: classData.coach,
          cap: classData.cap,
          reserved: [],
        }
      };

      dispatch({ type: 'ADD_CLASS', payload: newEvent });
      dispatch({ type: 'SET_LOADING', payload: false });
      
      return newEvent;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    }
  }, [state.currentBox, dispatch]);

  // 수업 정보 업데이트
  const updateClass = useCallback(async (
    classId: string, 
    updateData: UpdateClassResult
  ): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const payload: ClassPayload = {
        docKey: classId,
        box: state.currentBox,
        coach: updateData.coach,
        cap: updateData.cap,
        reserved: updateData.reserved,
      };

      await ClassService.updateClass(payload);

      console.log('updateData.reserved', updateData.reserved);

      dispatch({ 
        type: 'UPDATE_CLASS', 
        payload: { 
          id: classId, 
          updates: {
            extendedProps: {
              coach: updateData.coach,
              cap: updateData.cap,
              reserved: updateData.reserved || [],
            }
          }
        }
      });
      
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    }
  }, [state.currentBox, dispatch]);

  // 수업 삭제
  const deleteClass = useCallback(async (classId: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await ClassService.deleteClass(classId, state.currentBox);
      dispatch({ type: 'DELETE_CLASS', payload: classId });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    }
  }, [state.currentBox, dispatch]);

  // 4주간 반복 수업 생성
  const createRecurringClasses = useCallback(async (
    startDate: Date,
    classData: SaveClassResult
  ): Promise<ClassEvent[]> => {
    const createdClasses: ClassEvent[] = [];
    
    for (let week = 0; week < 4; week++) {
      const classDate = new Date(startDate);
      classDate.setDate(startDate.getDate() + (week * 7));
      
      try {
        const newClass = await createClass(classDate, classData);
        createdClasses.push(newClass);
      } catch (error) {
        console.error(`Failed to create class for week ${week + 1}:`, error);
        // 일부 실패해도 계속 진행
      }
    }
    
    return createdClasses;
  }, [createClass]);

  // 박스 변경
  const setCurrentBox = useCallback((boxName: string) => {
    dispatch({ type: 'SET_CURRENT_BOX', payload: boxName });
  }, [dispatch]);

  // 에러 클리어
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, [dispatch]);

  return {
    // 상태
    classes: state.classes,
    loading: state.loading,
    error: state.error,
    currentBox: state.currentBox,
    
    // 액션들
    loadMonthlyClasses,
    createClass,
    updateClass,
    deleteClass,
    createRecurringClasses,
    setCurrentBox,
    clearError,
  };
}; 