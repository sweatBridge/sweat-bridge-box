import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { ClassEvent } from '../types/class';

// 상태 타입 정의
interface ClassState {
  classes: ClassEvent[];
  loading: boolean;
  error: string | null;
  currentBox: string;
}

// 액션 타입 정의
type ClassAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CLASSES'; payload: ClassEvent[] }
  | { type: 'ADD_CLASS'; payload: ClassEvent }
  | { type: 'UPDATE_CLASS'; payload: { id: string; updates: Partial<ClassEvent> } }
  | { type: 'DELETE_CLASS'; payload: string }
  | { type: 'SET_CURRENT_BOX'; payload: string };

// 초기 상태
const initialState: ClassState = {
  classes: [],
  loading: false,
  error: null,
  currentBox: localStorage.getItem('boxName') || 'SWEAT', // localStorage에서 박스명 가져오기
};

// 리듀서 함수
function classReducer(state: ClassState, action: ClassAction): ClassState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_CLASSES':
      return { ...state, classes: action.payload, loading: false, error: null };
    case 'ADD_CLASS':
      return { ...state, classes: [...state.classes, action.payload] };
    case 'UPDATE_CLASS':
      return {
        ...state,
        classes: state.classes.map(classItem =>
          classItem.id === action.payload.id
            ? { ...classItem, ...action.payload.updates }
            : classItem
        )
      };
    case 'DELETE_CLASS':
      return {
        ...state,
        classes: state.classes.filter(classItem => classItem.id !== action.payload)
      };
    case 'SET_CURRENT_BOX':
      return { ...state, currentBox: action.payload };
    default:
      return state;
  }
}

// Context 타입 정의
interface ClassContextType {
  state: ClassState;
  dispatch: React.Dispatch<ClassAction>;
}

// Context 생성
const ClassContext = createContext<ClassContextType | undefined>(undefined);

// Provider 컴포넌트
interface ClassProviderProps {
  children: ReactNode;
}

export const ClassProvider = ({ children }: ClassProviderProps) => {
  const [state, dispatch] = useReducer(classReducer, initialState);

  return (
    <ClassContext.Provider value={{ state, dispatch }}>
      {children}
    </ClassContext.Provider>
  );
};

// 커스텀 훅
export const useClassContext = () => {
  const context = useContext(ClassContext);
  if (context === undefined) {
    throw new Error('useClassContext must be used within a ClassProvider');
  }
  return context;
}; 