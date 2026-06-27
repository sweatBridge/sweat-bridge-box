import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, PlusCircle, Building2, Users, ChevronRight, AlertCircle } from 'lucide-react';
import { AdminColors } from '../../constants/adminColors';
import { BoxInfo, BoxStatus } from '../../types/box';
import { useAdminBoxes } from '../../hooks/useAdminBoxes';

type FilterStatus = 'all' | BoxStatus;

const StatusBadge = ({ status }: { status?: BoxStatus }) => {
  const resolved = status ?? 'active';
  return (
    <span className={`ds-badge ${resolved === 'active' ? 'ds-badge--success' : 'ds-badge--error'}`}>
      {resolved === 'active' ? '활성' : '정지'}
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

const AdminBoxList = () => {
  const navigate = useNavigate();
  const { boxes, loading, error, loadBoxes } = useAdminBoxes();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  useEffect(() => { loadBoxes(); }, [loadBoxes]);

  const filtered = useMemo(() => {
    return boxes.filter((box) => {
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        !q ||
        box.boxName.toLowerCase().includes(q) ||
        box.representative.toLowerCase().includes(q) ||
        box.email.toLowerCase().includes(q);
      const effectiveStatus = box.status ?? 'active';
      const matchesStatus = filterStatus === 'all' || effectiveStatus === filterStatus;
      return matchesQuery && matchesStatus;
    });
  }, [boxes, searchQuery, filterStatus]);

  const totalActive = boxes.filter((b) => (b.status ?? 'active') === 'active').length;
  const totalSuspended = boxes.filter((b) => b.status === 'suspended').length;
  const totalMembers = boxes.reduce((sum, b) => sum + (b.memberCount ?? 0), 0);

  if (error) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '80px 20px', color: '#9ca3af',
      }}>
        <AlertCircle size={40} color="#ef4444" style={{ marginBottom: '12px' }} />
        <p style={{ margin: '0 0 16px', fontSize: '15px', color: '#374151' }}>{error}</p>
        <button
          onClick={loadBoxes}
          style={{
            padding: '9px 20px', border: 'none', borderRadius: '8px',
            background: AdminColors.primary, color: 'white', cursor: 'pointer', fontSize: '14px',
          }}
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="ds-page">
      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
        <SummaryCard label="전체 고객사" value={boxes.length} icon={Building2} color={AdminColors.primary} bg={AdminColors.primaryLight} />
        <SummaryCard label="활성 박스" value={totalActive} icon={Building2} color="#10b981" bg="#ecfdf5" />
        <SummaryCard label="정지 박스" value={totalSuspended} icon={Building2} color="#ef4444" bg="#fef2f2" />
      </div>

      {/* 전체 회원 수 배너 */}
      <div className="ds-card ds-card--pad" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: 'var(--radius-md)',
          background: 'var(--color-primary-bg)', color: 'var(--color-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Users size={20} />
        </div>
        <div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>전체 등록 회원 수</div>
          <div style={{ fontSize: '28px', fontWeight: '700', lineHeight: 1, color: 'var(--text-strong)' }}>
            {totalMembers > 0 ? `${totalMembers.toLocaleString()}명` : '-'}
          </div>
        </div>
      </div>

      {/* 검색 & 필터 & 테이블 */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px 24px',
      }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {/* 검색창 */}
          <div style={{
            flex: 1, minWidth: '200px',
            display: 'flex', alignItems: 'center', gap: '10px',
            border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', padding: '0 14px', background: 'var(--surface-muted)',
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

          {/* 상태 필터 */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['all', 'active', 'suspended'] as FilterStatus[]).map((val) => (
              <button
                key={val}
                onClick={() => setFilterStatus(val)}
                style={{
                  padding: '0 18px', height: '42px', borderRadius: '8px',
                  border: '1px solid',
                  borderColor: filterStatus === val ? AdminColors.primary : '#d1d5db',
                  background: filterStatus === val ? AdminColors.primary : 'var(--surface)',
                  color: filterStatus === val ? 'white' : 'var(--text-muted)',
                  fontSize: '14px', fontWeight: filterStatus === val ? '600' : '400',
                  cursor: 'pointer',
                }}
              >
                {val === 'all' ? '전체' : val === 'active' ? '활성' : '정지'}
              </button>
            ))}
          </div>

          <button
            onClick={() => navigate('/admin/boxes/new')}
            className="ds-btn ds-btn--primary"
            style={{
              height: '42px', padding: '0 18px',
            }}
          >
            <PlusCircle size={16} />
            신규 등록
          </button>
        </div>

        {/* 테이블 헤더 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1.2fr 1.5fr 0.8fr 0.8fr 1fr',
          gap: '12px', padding: '12px 16px',
          background: '#f8fafc', borderRadius: '8px',
          fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '4px',
        }}>
          <div>박스명</div>
          <div>대표자</div>
          <div>이메일</div>
          <div>코치</div>
          <div>회원 수</div>
          <div>상태</div>
        </div>

        {/* 로딩 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
            <div style={{
              width: '32px', height: '32px', margin: '0 auto 12px',
              border: '3px solid #e2e8f0', borderTop: `3px solid ${AdminColors.primary}`,
              borderRadius: '50%', animation: 'spin 1s linear infinite',
            }} />
            <p style={{ margin: 0, fontSize: '14px' }}>고객사 목록을 불러오는 중...</p>
            <style>{`@keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }`}</style>
          </div>
        )}

        {/* 빈 상태 */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
            <Building2 size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: '15px' }}>
              {boxes.length === 0 ? '등록된 고객사가 없습니다.' : '검색 결과가 없습니다.'}
            </p>
          </div>
        )}

        {/* 목록 */}
        {!loading && filtered.map((box: BoxInfo) => (
          <div
            key={box.boxName}
            onClick={() => navigate(`/admin/boxes/${box.boxName}`, { state: { box } })}
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1.2fr 1.5fr 0.8fr 0.8fr 1fr',
              gap: '12px', padding: '16px',
              borderRadius: '8px', cursor: 'pointer',
              alignItems: 'center', borderBottom: '1px solid #f3f4f6',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '8px', background: AdminColors.primaryLight,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Building2 size={16} color={AdminColors.primary} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{box.boxName}</div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                  {box.address?.roadAddress || '-'}
                </div>
              </div>
            </div>
            <div style={{ fontSize: '14px', color: '#374151' }}>{box.representative || '-'}</div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>{box.email || '-'}</div>
            <div style={{ fontSize: '14px', color: '#374151' }}>
              {(box.coaches?.length ?? 0)}명
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              {box.memberCount !== undefined ? `${box.memberCount}명` : '-'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <StatusBadge status={box.status} />
              <ChevronRight size={14} color="#d1d5db" />
            </div>
          </div>
        ))}

        <div style={{ marginTop: '12px', fontSize: '13px', color: '#9ca3af' }}>
          총 {filtered.length}개 박스
        </div>
      </div>
    </div>
  );
};

export default AdminBoxList;
