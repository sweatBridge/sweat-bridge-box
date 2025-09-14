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
  const loadMembers = useCallback(async (box: string = 'SWEAT') => {
    setLoading(true);
    setError(null);
    
    try {
      const members = await MemberService.getMembers(box);
      setState(prev => ({ ...prev, members, loading: false }));
    } catch (error) {
      setError((error as Error).message);
      setLoading(false);
    }
  }, [setLoading, setError]);

  // 회원 삭제
  const deleteMember = useCallback(async (email: string, box: string = 'default') => {
    setLoading(true);
    setError(null);
    
    try {
      await MemberService.deleteMember(box, email);
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

  // 회원 멤버십 업데이트
  const updateMemberMembership = useCallback(async (
    email: string, 
    membershipData: any, 
    box: string = 'default'
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      await MemberService.updateMemberMembership(box, email, membershipData);
      // 회원 목록 다시 로드
      await loadMembers(box);
    } catch (error) {
      setError((error as Error).message);
      setLoading(false);
      throw error;
    }
  }, [setLoading, setError, loadMembers]);

  // 새 회원 추가
  const addMember = useCallback(async (memberData: any, box: string = 'default') => {
    setLoading(true);
    setError(null);
    
    try {
      await MemberService.addMember(box, memberData);
      // 회원 목록 다시 로드
      await loadMembers(box);
    } catch (error) {
      setError((error as Error).message);
      setLoading(false);
      throw error;
    }
  }, [setLoading, setError, loadMembers]);

  return {
    members: state.members,
    loading: state.loading,
    error: state.error,
    loadMembers,
    deleteMember,
    updateMemberMembership,
    addMember,
    clearError
  };
}; 