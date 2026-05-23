import { useState, useCallback } from 'react';
import { Member } from '../types/member';
import { MemberService } from '../services/memberService';

interface MemberManagementState {
  members: Member[];
  loading: boolean;
  error: string | null;
}

export const useMemberManagement = () => {
  const [state, setState] = useState<MemberManagementState>({
    members: [],
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

  // 회원 목록 로드
  const loadMembers = useCallback(async (box?: string) => {
    const boxName = box || localStorage.getItem('boxName') || 'SWEAT';
    setLoading(true);
    setError(null);
    
    try {
      const members = await MemberService.getMembers(boxName);
      setState(prev => ({ ...prev, members, loading: false }));
    } catch (error) {
      setError((error as Error).message);
      setLoading(false);
    }
  }, [setLoading, setError]);

  // 회원 삭제
  const deleteMember = useCallback(async (email: string, box?: string) => {
    const boxName = box || localStorage.getItem('boxName') || 'SWEAT';
    setLoading(true);
    setError(null);
    
    try {
      await MemberService.deleteMember(boxName, email);
      setState(prev => ({
        ...prev,
        members: prev.members.filter(member => member.email !== email),
        loading: false
      }));
    } catch (error) {
      setError((error as Error).message);
      setLoading(false);
      throw error;
    }
  }, [setLoading, setError]);

      // 회원 회원권 업데이트
  const updateMemberMembership = useCallback(async (
    email: string, 
    membershipData: any, 
    box?: string
  ) => {
    const boxName = box || localStorage.getItem('boxName') || 'SWEAT';
    setLoading(true);
    setError(null);
    
    try {
      await MemberService.updateMemberMembership(boxName, email, membershipData);
      // 회원 목록 다시 로드
      await loadMembers(boxName);
    } catch (error) {
      setError((error as Error).message);
      setLoading(false);
      throw error;
    }
  }, [setLoading, setError, loadMembers]);

  // 새 회원 추가
  const addMember = useCallback(async (memberData: any, box?: string) => {
    const boxName = box || localStorage.getItem('boxName') || 'SWEAT';
    setLoading(true);
    setError(null);
    
    try {
      await MemberService.addMember(boxName, memberData);
      // 회원 목록 다시 로드
      await loadMembers(boxName);
    } catch (error) {
      setError((error as Error).message);
      setLoading(false);
      throw error;
    }
  }, [setLoading, setError, loadMembers]);

  // 회원 메모 업데이트 (새로고침 없이 로컬 상태 즉시 업데이트)
  const updateMemberMemo = useCallback(async (email: string, memo: string, box?: string) => {
    const boxName = box || localStorage.getItem('boxName') || 'SWEAT';
    setError(null);
    
    try {
      await MemberService.updateMemberMemo(boxName, email, memo);
      // 로컬 상태 즉시 업데이트 (새로고침 없이 반영)
      setState(prev => ({
        ...prev,
        members: prev.members.map(member => 
          member.email === email 
            ? { ...member, memo: memo }
            : member
        )
      }));
    } catch (error) {
      setError((error as Error).message);
      throw error;
    }
  }, [setError]);

  return {
    members: state.members,
    loading: state.loading,
    error: state.error,
    loadMembers,
    deleteMember,
    updateMemberMembership,
    addMember,
    updateMemberMemo,
    clearError
  };
}; 