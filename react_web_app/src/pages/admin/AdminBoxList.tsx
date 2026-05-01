import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, PlusCircle, Building2, Users, ChevronRight } from 'lucide-react';
import { AppColors } from '../../constants/colors';
import { MOCK_BOXES } from './_mockData';
import { BoxStatus } from '../../types/box';

type FilterStatus = 'all' | BoxStatus;

const StatusBadge = ({ status }: { status: BoxStatus }) => (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    background: status === 'active' ? '#d1fae5' : '#fee2e2',
    color: status === 'active' ? '#065f46' : '#991b1b',
  }}>
    <span style={{
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      background: status === 'active' ? '#10b981' : '#ef4444',
    }} />
    {status === 'active' ? '활성' : '정지'}
  </span>
);

const AdminBoxList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const filtered = useMemo(() => {
    return MOCK_BOXES.filter((box) => {
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        !q ||
        box.boxName.toLowerCase().includes(q) ||
        box.representative.toLowerCase().includes(q) ||
        box.email.toLowerCase().includes(q);
      const matchesStatus = filterStatus === 'all' || box.status === filterStatus;
      return matchesQuery && matchesStatus;
    });
  }, [searchQuery, filterStatus]);

  const totalActive = MOCK_BOXES.filter((b) => b.status === 'active').length;
  const totalSuspended = MOCK_BOXES.filter((b) => b.status === 'suspended').length;
  const totalMembers = MOCK_BOXES.reduce((sum, b) => sum + b.memberCount, 0);

  return (
    <div>
      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: '전체 고객사', value: MOCK_BOXES.length, color: '#3182f6', bg: '#eff6ff' },
          { label: '활성 박스', value: totalActive, color: '#10b981', bg: '#d1fae5' },
          { label: '정지 박스', value: totalSuspended, color: '#ef4444', bg: '#fee2e2' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '10px',
              background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Building2 size={20} color={color} />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>{label}</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#111827', lineHeight: 1 }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 전체 회원 수 요약 */}
      <div style={{
        background: `linear-gradient(135deg, ${AppColors.primary} 0%, #1d4ed8 100%)`,
        borderRadius: '12px',
        padding: '20px 24px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        color: 'white',
      }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '10px',
          background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Users size={20} color="white" />
        </div>
        <div>
          <div style={{ fontSize: '13px', opacity: 0.8 }}>전체 등록 회원 수</div>
          <div style={{ fontSize: '28px', fontWeight: '700', lineHeight: 1 }}>{totalMembers.toLocaleString()}명</div>
        </div>
      </div>

      {/* 검색 & 필터 */}
      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px 24px',
      }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{
            flex: 1, minWidth: '200px',
            display: 'flex', alignItems: 'center', gap: '10px',
            border: '1px solid #d1d5db', borderRadius: '8px', padding: '0 14px',
            background: '#f9fafb',
          }}>
            <Search size={16} color="#9ca3af" />
            <input
              type="text"
              placeholder="박스명, 대표자, 이메일 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1, border: 'none', background: 'transparent',
                fontSize: '14px', color: '#374151', outline: 'none', padding: '10px 0',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {([['all', '전체'], ['active', '활성'], ['suspended', '정지']] as [FilterStatus, string][]).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilterStatus(val)}
                style={{
                  padding: '0 18px',
                  height: '42px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: filterStatus === val ? AppColors.primary : '#d1d5db',
                  background: filterStatus === val ? AppColors.primary : 'white',
                  color: filterStatus === val ? 'white' : '#6b7280',
                  fontSize: '14px',
                  fontWeight: filterStatus === val ? '600' : '400',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={() => navigate('/admin/boxes/new')}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '0 18px', height: '42px', borderRadius: '8px',
              border: 'none', background: AppColors.primary, color: 'white',
              fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            }}
          >
            <PlusCircle size={16} />
            신규 등록
          </button>
        </div>

        {/* 테이블 */}
        <div style={{ overflowX: 'auto' }}>
          {/* 헤더 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.2fr 1.5fr 1fr 0.8fr 80px',
            gap: '12px',
            padding: '12px 16px',
            background: '#f8fafc',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            color: '#6b7280',
            marginBottom: '8px',
          }}>
            <div>박스명</div>
            <div>대표자</div>
            <div>이메일</div>
            <div>회원 수</div>
            <div>상태</div>
            <div>등록일</div>
          </div>

          {filtered.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '60px 20px', color: '#9ca3af',
            }}>
              <Building2 size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: '15px' }}>검색 결과가 없습니다.</p>
            </div>
          ) : (
            filtered.map((box) => (
              <div
                key={box.boxName}
                onClick={() => navigate(`/admin/boxes/${box.boxName}`)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1.2fr 1.5fr 1fr 0.8fr 80px',
                  gap: '12px',
                  padding: '16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  alignItems: 'center',
                  borderBottom: '1px solid #f3f4f6',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '8px',
                    background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Building2 size={16} color={AppColors.primary} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{box.boxName}</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{box.address.roadAddress}</div>
                  </div>
                </div>
                <div style={{ fontSize: '14px', color: '#374151' }}>{box.representative}</div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>{box.email}</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  {box.memberCount}명
                </div>
                <div><StatusBadge status={box.status || 'active'} /></div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {box.createdAt}
                  <ChevronRight size={14} color="#d1d5db" style={{ display: 'block', marginTop: '4px' }} />
                </div>
              </div>
            ))
          )}
        </div>
        <div style={{ marginTop: '12px', fontSize: '13px', color: '#9ca3af' }}>
          총 {filtered.length}개 박스
        </div>
      </div>
    </div>
  );
};

export default AdminBoxList;
