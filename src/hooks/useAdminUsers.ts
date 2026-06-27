import { useCallback, useState } from 'react';
import { AdminUserRepository } from '../repositories';
import { AdminUserSummary } from '../types/adminUser';
import { UserRole } from '../types/auth';

interface AdminUsersState {
  users: AdminUserSummary[];
  loading: boolean;
  error: string | null;
}

export const useAdminUsers = () => {
  const [state, setState] = useState<AdminUsersState>({
    users: [],
    loading: false,
    error: null,
  });

  const loadUsers = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const users = await AdminUserRepository.listAllUsers();
      setState({ users, loading: false, error: null });
    } catch {
      setState((prev) => ({ ...prev, loading: false, error: '유저 목록을 불러오지 못했습니다.' }));
    }
  }, []);

  const updateUserRole = useCallback(async (email: string, role: UserRole) => {
    await AdminUserRepository.updateUserRole(email, role);
    setState((prev) => ({
      ...prev,
      users: prev.users.map((user) => user.email === email ? { ...user, role } : user),
    }));
  }, []);

  return {
    users: state.users,
    loading: state.loading,
    error: state.error,
    loadUsers,
    updateUserRole,
  };
};
