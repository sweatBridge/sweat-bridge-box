import { useEffect, useState, useMemo } from 'react';
import { Search, Users, UserCheck, UserCog, ShieldCheck, X, ChevronDown, ChevronRight, Building2, AlertCircle } from 'lucide-react';
import { AdminColors } from '../../constants/adminColors';
import { UserRole, BoxStatus } from '../../types/auth';
import { AdminUserRole, AdminUserSummary } from '../../types/adminUser';
import { useAdminUsers } from '../../hooks/useAdminUsers';

type RoleFilter = 'all' | AdminUserRole;

const normalizeBoxName = (boxName: string): string => boxName.replace(/^\?+/, '').trim();

const ROLE_SORT_ORDER: Record<AdminUserRole, number> = {
  admin: 0,
  coach: 1,
  member: 2,
  unknown: 3,
};

const ROLE_LABEL: Record<AdminUserRole, string> = {
  member: '회원',
  coach: '코치',
  admin: '어드민',
  unknown: '미확인',
};

const ROLE_COLOR: Record<AdminUserRole, { bg: string; color: string }> = {
  member: { bg: '#f3f4f6', color: '#4b5563' },
  coach: { bg: '#eff6ff', color: '#1d4ed8' },
  admin: { bg: '#fdf4ff', color: '#7e22ce' },
  unknown: { bg: '#fff7ed', color: '#c2410c' },
};

const BOX_STATUS_LABEL: Record<BoxStatus, string> = {
  NONE: '미설정',
  PENDING: '승인 대기',
  APPROVED: '승인',
  REJECTED: '거절',
};

const BOX_STATUS_COLOR: Record<BoxStatus, { bg: string; color: string }> = {
  NONE: { bg: '#f3f4f6', color: '#6b7280' },
  PENDING: { bg: '#fffbeb', color: '#b45309' },
  APPROVED: { bg: '#d1fae5', color: '#065f46' },
  REJECTED: { bg: '#fee2e2', color: '#991b1b' },
};

const RoleBadge = ({ role }: { role: AdminUserRole }) => {
  const { bg, color } = ROLE_COLOR[role];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600',
      background: bg, color,
    }}>
      {ROLE_LABEL[role]}
    </span>
  );
};

const StatusBadge = ({ status }: { status?: BoxStatus }) => {
  const resolved = status ?? 'NONE';
  const { bg, color } = BOX_STATUS_COLOR[resolved];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '500',
      background: bg, color,
    }}>
      {BOX_STATUS_LABEL[resolved]}
    </span>
  );
};

const SummaryCard = ({
  label, value, icon: Icon, color, bg,
}: { label: string; value: number; icon: React.ElementType; color: string; bg: string }) => (
  <div className="ds-stat">
    <div className="ds-stat__top">
      <div className="ds-stat__icon" style={{ background: bg, color }}>
        <Icon />
      </div>
      <span className="ds-stat__label">{label}</span>
    </div>
    <div className="ds-stat__value">{value}</div>
  </div>
);

interface RoleChangeModalProps {
  user: AdminUserSummary;
  onConfirm: (newRole: UserRole) => Promise<void>;
  onClose: () => void;
  submitting: boolean;
  error: string | null;
}

const RoleChangeModal = ({ user, onConfirm, onClose, submitting, error }: RoleChangeModalProps) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(
    user.role === 'unknown' ? null : user.role as UserRole
  );

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '28px 32px',
          width: '400px', boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '9px', background: '#f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <UserCog size={18} color={AdminColors.primary} />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>역할 변경</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>{user.realName} ({user.email})</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={18} color="#9ca3af" />
          </button>
        </div>

        <div style={{
          background: '#f8fafc', borderRadius: '10px', padding: '12px 16px',
          marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>현재 역할</span>
          <RoleBadge role={user.role} />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '10px' }}>
            변경할 역할 선택
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(['member', 'coach', 'admin'] as UserRole[]).map((role) => {
              const { bg, color } = ROLE_COLOR[role];
              const isSelected = selectedRole === role;
              return (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', borderRadius: '10px', cursor: 'pointer',
                    border: `2px solid ${isSelected ? color : '#e5e7eb'}`,
                    background: isSelected ? bg : 'white',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: isSelected ? color : '#d1d5db',
                    }} />
                    <span style={{ fontSize: '14px', fontWeight: isSelected ? '600' : '400', color: isSelected ? color : '#374151' }}>
                      {ROLE_LABEL[role]}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                    {role === 'member' && '일반 회원'}
                    {role === 'coach' && '박스 내 기능 접근'}
                    {role === 'admin' && '어드민 포털 + 전체 권한'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              flex: 1, padding: '11px', borderRadius: '9px',
              border: '1px solid var(--border-strong)', background: 'var(--surface)',
              fontSize: '14px', fontWeight: '500', color: '#374151', cursor: 'pointer',
            }}
          >
            취소
          </button>
          <button
            onClick={() => selectedRole && void onConfirm(selectedRole)}
            disabled={!selectedRole || selectedRole === user.role || submitting}
            style={{
              flex: 1, padding: '11px', borderRadius: '9px', border: 'none',
              background: !selectedRole || selectedRole === user.role || submitting ? '#e5e7eb' : AdminColors.primary,
              fontSize: '14px', fontWeight: '600',
              color: !selectedRole || selectedRole === user.role || submitting ? '#9ca3af' : 'white',
              cursor: !selectedRole || selectedRole === user.role || submitting ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {submitting ? '변경 중...' : '변경 확인'}
          </button>
        </div>
        {error && (
          <div style={{ marginTop: '12px', fontSize: '13px', color: '#dc2626', textAlign: 'center' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

const COL = '2fr 1fr 1.1fr 0.9fr 0.8fr';

const TableHeader = () => (
  <div style={{
    display: 'grid', gridTemplateColumns: COL,
    gap: '12px', padding: '10px 16px',
    background: '#f8fafc', borderRadius: '8px',
    fontSize: '12px', fontWeight: '600', color: '#9ca3af',
    marginBottom: '2px',
  }}>
    <div>유저</div>
    <div>역할</div>
    <div>가입일</div>
    <div>박스 상태</div>
    <div>액션</div>
  </div>
);

interface UserRowProps {
  user: AdminUserSummary;
  onRoleChange: (user: AdminUserSummary) => void;
}

const UserRow = ({ user, onRoleChange }: UserRowProps) => (
  <div style={{
    display: 'grid', gridTemplateColumns: COL,
    gap: '12px', padding: '13px 16px',
    borderRadius: '8px', alignItems: 'center',
    borderBottom: '1px solid #f3f4f6',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%',
        background: ROLE_COLOR[user.role].bg, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '13px', fontWeight: '700', color: ROLE_COLOR[user.role].color,
      }}>
        {user.realName[0]}
      </div>
      <div>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
          {user.realName}
          <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '6px', fontWeight: '400' }}>
            @{user.nickName}
          </span>
        </div>
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '1px' }}>{user.email}</div>
      </div>
    </div>
    <div><RoleBadge role={user.role} /></div>
    <div style={{ fontSize: '13px', color: '#6b7280' }}>{user.createdAt}</div>
    <div><StatusBadge status={user.status} /></div>
    <div>
      <button
        onClick={() => onRoleChange(user)}
        style={{
          padding: '6px 12px', borderRadius: '7px',
          border: `1px solid ${AdminColors.primary}`,
          background: 'var(--surface)', color: AdminColors.primary,
          fontSize: '12px', fontWeight: '600', cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = AdminColors.primary;
          (e.currentTarget as HTMLButtonElement).style.color = 'white';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'white';
          (e.currentTarget as HTMLButtonElement).style.color = AdminColors.primary;
        }}
      >
        역할 변경
      </button>
    </div>
  </div>
);

interface BoxGroupProps {
  boxName: string;
  users: AdminUserSummary[];
  onRoleChange: (user: AdminUserSummary) => void;
}

const BoxGroup = ({ boxName, users, onRoleChange }: BoxGroupProps) => {
  const [collapsed, setCollapsed] = useState(true);
  const isUnassigned = !boxName;

  return (
    <div className="ds-card" style={{ overflow: 'hidden', marginBottom: '12px' }}>
      {/* 박스 헤더 */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
          padding: '14px 20px', background: 'transparent', border: 'none', cursor: 'pointer',
          borderBottom: collapsed ? 'none' : '1px solid var(--border)',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-muted)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <div style={{
          width: '34px', height: '34px', borderRadius: '8px',
          background: isUnassigned ? '#f3f4f6' : AdminColors.primaryLight,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Building2 size={16} color={isUnassigned ? '#9ca3af' : AdminColors.primary} />
        </div>
        <div style={{ textAlign: 'left', flex: 1 }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>
            {isUnassigned ? '미지정' : boxName}
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
            유저 {users.length}명
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', marginRight: '8px' }}>
          {(['member', 'coach', 'admin', 'unknown'] as AdminUserRole[]).map((role) => {
            const count = users.filter((u) => u.role === role).length;
            if (count === 0) return null;
            const { bg, color } = ROLE_COLOR[role];
            return (
              <span key={role} style={{
                padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: '600',
                background: bg, color,
              }}>
                {ROLE_LABEL[role]} {count}
              </span>
            );
          })}
        </div>
        {collapsed
          ? <ChevronRight size={16} color="#9ca3af" />
          : <ChevronDown size={16} color="#9ca3af" />}
      </button>

      {/* 유저 목록 */}
      {!collapsed && (
        <div style={{ padding: '8px 20px 12px' }}>
          <TableHeader />
          {users.map((user) => (
            <UserRow key={user.uid} user={user} onRoleChange={onRoleChange} />
          ))}
        </div>
      )}
    </div>
  );
};

const AdminUserList = () => {
  const { users, loading, error, loadUsers, updateUserRole } = useAdminUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<RoleFilter>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUserSummary | null>(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [roleUpdating, setRoleUpdating] = useState(false);
  const [roleUpdateError, setRoleUpdateError] = useState<string | null>(null);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        !q ||
        u.email.toLowerCase().includes(q) ||
        u.realName.toLowerCase().includes(q) ||
        u.nickName.toLowerCase().includes(q) ||
        u.boxName.toLowerCase().includes(q);
      const matchesRole = filterRole === 'all' || u.role === filterRole;
      return matchesQuery && matchesRole;
    });
  }, [users, searchQuery, filterRole]);

  // 가입 대기 사용자의 "?" 접두사를 제거해 실제 박스 기준으로 묶습니다.
  // 박스명은 가나다순, 그룹 내부는 권한과 이름 순으로 정렬합니다.
  const grouped = useMemo(() => {
    const map = new Map<string, AdminUserSummary[]>();
    for (const u of filtered) {
      const key = normalizeBoxName(u.boxName);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(u);
    }
    return Array.from(map.entries())
      .map(([boxName, boxUsers]) => [
        boxName,
        [...boxUsers].sort((a, b) =>
          ROLE_SORT_ORDER[a.role] - ROLE_SORT_ORDER[b.role]
          || a.realName.localeCompare(b.realName, 'ko')
        ),
      ] as [string, AdminUserSummary[]])
      .sort(([a], [b]) => {
        if (!a) return 1;
        if (!b) return -1;
        return a.localeCompare(b, 'ko');
      });
  }, [filtered]);

  const totalCoach = users.filter((u) => u.role === 'coach').length;
  const totalMember = users.filter((u) => u.role === 'member').length;
  const totalAdmin = users.filter((u) => u.role === 'admin').length;

  const handleRoleChange = async (newRole: UserRole) => {
    if (!selectedUser) return;
    setRoleUpdating(true);
    setRoleUpdateError(null);
    try {
      await updateUserRole(selectedUser.email, newRole);
      setSelectedUser(null);
    } catch {
      setRoleUpdateError('역할 변경에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setRoleUpdating(false);
    }
  };

  const ROLE_FILTERS: { value: RoleFilter; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'member', label: '회원' },
    { value: 'coach', label: '코치' },
    { value: 'admin', label: '어드민' },
    { value: 'unknown', label: '미확인' },
  ];

  return (
    <div>
      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <SummaryCard label="전체 유저" value={users.length} icon={Users} color={AdminColors.primary} bg={AdminColors.primaryLight} />
        <SummaryCard label="회원" value={totalMember} icon={Users} color="#4b5563" bg="#f3f4f6" />
        <SummaryCard label="코치" value={totalCoach} icon={UserCheck} color="#1d4ed8" bg="#dbeafe" />
        <SummaryCard label="어드민" value={totalAdmin} icon={ShieldCheck} color="#7e22ce" bg="#f3e8ff" />
      </div>

      {/* 검색 & 필터 */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{
          flex: 1, minWidth: '200px',
          display: 'flex', alignItems: 'center', gap: '10px',
          border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', padding: '0 14px', background: 'var(--surface)',
        }}>
          <Search size={16} color="#9ca3af" />
          <input
            type="text"
            placeholder="이름, 이메일, 박스명 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1, border: 'none', background: 'transparent',
              fontSize: '14px', color: '#374151', outline: 'none', padding: '10px 0',
            }}
          />
        </div>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '0 16px', height: '42px', borderRadius: '8px',
              border: `1px solid ${filterRole !== 'all' ? AdminColors.primary : '#d1d5db'}`,
              background: filterRole !== 'all' ? AdminColors.primary : 'var(--surface)',
              color: filterRole !== 'all' ? 'white' : 'var(--text)',
              fontSize: '14px', cursor: 'pointer', fontWeight: '500',
            }}
          >
            {ROLE_FILTERS.find((f) => f.value === filterRole)?.label}
            <ChevronDown size={14} />
          </button>
          {roleDropdownOpen && (
            <div style={{
              position: 'absolute', top: '46px', left: 0, zIndex: 100,
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-md)', overflow: 'hidden', minWidth: '110px',
            }}>
              {ROLE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => { setFilterRole(f.value); setRoleDropdownOpen(false); }}
                  style={{
                    display: 'block', width: '100%', padding: '10px 16px',
                    border: 'none', background: filterRole === f.value ? '#f1f5f9' : 'white',
                    fontSize: '14px', color: '#374151', cursor: 'pointer', textAlign: 'left',
                    fontWeight: filterRole === f.value ? '600' : '400',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 박스별 그룹 */}
      {loading ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
          textAlign: 'center', padding: '60px 20px', color: '#9ca3af',
        }}>
          <div style={{
            width: '32px', height: '32px', margin: '0 auto 12px',
            border: '3px solid #e2e8f0', borderTop: `3px solid ${AdminColors.primary}`,
            borderRadius: '50%', animation: 'spin 1s linear infinite',
          }} />
          <p style={{ margin: 0, fontSize: '14px' }}>유저 목록을 불러오는 중...</p>
          <style>{`@keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }`}</style>
        </div>
      ) : error ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
          textAlign: 'center', padding: '60px 20px', color: '#9ca3af',
        }}>
          <AlertCircle size={40} color="#ef4444" style={{ marginBottom: '12px' }} />
          <p style={{ margin: '0 0 16px', fontSize: '15px', color: '#374151' }}>{error}</p>
          <button
            onClick={() => void loadUsers()}
            style={{
              padding: '9px 20px', border: 'none', borderRadius: '8px',
              background: AdminColors.primary, color: 'white', cursor: 'pointer', fontSize: '14px',
            }}
          >
            다시 시도
          </button>
        </div>
      ) : grouped.length === 0 ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
          textAlign: 'center', padding: '60px 20px', color: '#9ca3af',
        }}>
          <Users size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
          <p style={{ margin: 0, fontSize: '15px' }}>검색 결과가 없습니다.</p>
        </div>
      ) : (
        <>
          {grouped.map(([boxName, boxUsers]) => (
            <BoxGroup
              key={boxName || '__unassigned__'}
              boxName={boxName}
              users={boxUsers}
              onRoleChange={setSelectedUser}
            />
          ))}
          <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>
            총 {grouped.length}개 박스 · {filtered.length}명
          </div>
        </>
      )}

      {selectedUser && (
        <RoleChangeModal
          user={selectedUser}
          onConfirm={handleRoleChange}
          onClose={() => {
            setSelectedUser(null);
            setRoleUpdateError(null);
          }}
          submitting={roleUpdating}
          error={roleUpdateError}
        />
      )}
    </div>
  );
};

export default AdminUserList;
