import { useState, useMemo } from 'react';
import { Search, Users, UserCheck, UserCog, ShieldCheck, X, ChevronDown, ChevronRight, Building2 } from 'lucide-react';
import { AdminColors } from '../../constants/adminColors';
import { UserRole, BoxStatus } from '../../types/auth';
import { MOCK_USERS, AdminUserSummary } from './_mockData';

type RoleFilter = 'all' | UserRole;

const ROLE_LABEL: Record<UserRole, string> = {
  coach: '코치',
  operator: '운영자',
  admin: '어드민',
};

const ROLE_COLOR: Record<UserRole, { bg: string; color: string }> = {
  coach: { bg: '#eff6ff', color: '#1d4ed8' },
  operator: { bg: '#f0fdf4', color: '#15803d' },
  admin: { bg: '#fdf4ff', color: '#7e22ce' },
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

const RoleBadge = ({ role }: { role: UserRole }) => {
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
  <div style={{
    background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px',
    padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px',
  }}>
    <div style={{
      width: '44px', height: '44px', borderRadius: '10px', background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={20} color={color} />
    </div>
    <div>
      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: '700', color: '#111827', lineHeight: 1 }}>{value}</div>
    </div>
  </div>
);

interface RoleChangeModalProps {
  user: AdminUserSummary;
  onConfirm: (newRole: UserRole) => void;
  onClose: () => void;
}

const RoleChangeModal = ({ user, onConfirm, onClose }: RoleChangeModalProps) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);

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
          background: 'white', borderRadius: '16px', padding: '28px 32px',
          width: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
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
            {(['coach', 'operator', 'admin'] as UserRole[]).map((role) => {
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
                    {role === 'coach' && '박스 내 기능 접근'}
                    {role === 'operator' && '어드민 포털 접근'}
                    {role === 'admin' && '전체 권한'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '11px', borderRadius: '9px',
              border: '1px solid #e5e7eb', background: 'white',
              fontSize: '14px', fontWeight: '500', color: '#374151', cursor: 'pointer',
            }}
          >
            취소
          </button>
          <button
            onClick={() => onConfirm(selectedRole)}
            disabled={selectedRole === user.role}
            style={{
              flex: 1, padding: '11px', borderRadius: '9px', border: 'none',
              background: selectedRole === user.role ? '#e5e7eb' : AdminColors.primary,
              fontSize: '14px', fontWeight: '600',
              color: selectedRole === user.role ? '#9ca3af' : 'white',
              cursor: selectedRole === user.role ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            변경 확인
          </button>
        </div>
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
          background: 'white', color: AdminColors.primary,
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
  const [collapsed, setCollapsed] = useState(false);
  const isUnassigned = !boxName;

  return (
    <div style={{
      background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px',
      overflow: 'hidden', marginBottom: '12px',
    }}>
      {/* 박스 헤더 */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
          padding: '14px 20px', background: 'transparent', border: 'none', cursor: 'pointer',
          borderBottom: collapsed ? 'none' : '1px solid #f3f4f6',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
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
          {(['coach', 'operator', 'admin'] as UserRole[]).map((role) => {
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
  const [users, setUsers] = useState<AdminUserSummary[]>(MOCK_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<RoleFilter>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUserSummary | null>(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

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

  // 박스별 그룹핑 — boxName 알파벳순, 미지정은 마지막
  const grouped = useMemo(() => {
    const map = new Map<string, AdminUserSummary[]>();
    for (const u of filtered) {
      const key = u.boxName || '';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(u);
    }
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (!a) return 1;
      if (!b) return -1;
      return a.localeCompare(b);
    });
  }, [filtered]);

  const totalCoach = users.filter((u) => u.role === 'coach').length;
  const totalOperator = users.filter((u) => u.role === 'operator').length;
  const totalAdmin = users.filter((u) => u.role === 'admin').length;

  const handleRoleChange = (newRole: UserRole) => {
    if (!selectedUser) return;
    setUsers((prev) =>
      prev.map((u) => (u.uid === selectedUser.uid ? { ...u, role: newRole } : u))
    );
    setSelectedUser(null);
  };

  const ROLE_FILTERS: { value: RoleFilter; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'coach', label: '코치' },
    { value: 'operator', label: '운영자' },
    { value: 'admin', label: '어드민' },
  ];

  return (
    <div>
      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <SummaryCard label="전체 유저" value={users.length} icon={Users} color="#3182f6" bg="#eff6ff" />
        <SummaryCard label="코치" value={totalCoach} icon={UserCheck} color="#1d4ed8" bg="#dbeafe" />
        <SummaryCard label="운영자" value={totalOperator} icon={UserCog} color="#15803d" bg="#dcfce7" />
        <SummaryCard label="어드민" value={totalAdmin} icon={ShieldCheck} color="#7e22ce" bg="#f3e8ff" />
      </div>

      {/* 검색 & 필터 */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{
          flex: 1, minWidth: '200px',
          display: 'flex', alignItems: 'center', gap: '10px',
          border: '1px solid #d1d5db', borderRadius: '8px', padding: '0 14px', background: 'white',
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
              background: filterRole !== 'all' ? AdminColors.primary : 'white',
              color: filterRole !== 'all' ? 'white' : '#374151',
              fontSize: '14px', cursor: 'pointer', fontWeight: '500',
            }}
          >
            {ROLE_FILTERS.find((f) => f.value === filterRole)?.label}
            <ChevronDown size={14} />
          </button>
          {roleDropdownOpen && (
            <div style={{
              position: 'absolute', top: '46px', left: 0, zIndex: 100,
              background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)', overflow: 'hidden', minWidth: '110px',
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
      {grouped.length === 0 ? (
        <div style={{
          background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px',
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
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
};

export default AdminUserList;
