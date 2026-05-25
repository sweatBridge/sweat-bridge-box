import { useEffect, useMemo } from 'react';
import { Building2, Users, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminColors } from '../../constants/adminColors';
import { useAdminBoxes } from '../../hooks/useAdminBoxes';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { boxes, loading, error, loadBoxes } = useAdminBoxes();

  useEffect(() => { loadBoxes(); }, [loadBoxes]);

  const stats = useMemo(() => {
    const totalBoxes = boxes.length;
    const activeBoxes = boxes.filter((b) => (b.status ?? 'active') === 'active').length;
    const suspendedBoxes = boxes.filter((b) => b.status === 'suspended').length;

    // memberCount가 있는 박스만 합산
    const boxesWithCount = boxes.filter((b) => b.memberCount !== undefined);
    const totalMembers = boxesWithCount.reduce((sum, b) => sum + (b.memberCount ?? 0), 0);
    const avgMembers = boxesWithCount.length > 0 ? Math.round(totalMembers / boxesWithCount.length) : null;

    // TOP 5: memberCount 있는 활성 박스만 대상
    const topBoxes = boxes
      .filter((b) => (b.status ?? 'active') === 'active' && b.memberCount !== undefined)
      .sort((a, b) => (b.memberCount ?? 0) - (a.memberCount ?? 0))
      .slice(0, 5);
    const maxMembers = topBoxes.length > 0 ? Math.max(...topBoxes.map((b) => b.memberCount ?? 0)) : 0;

    return { totalBoxes, activeBoxes, suspendedBoxes, totalMembers, avgMembers, topBoxes, maxMembers, boxesWithCount };
  }, [boxes]);

  const summaryCards = [
    { label: '전체 고객사', value: stats.totalBoxes, unit: '개', icon: Building2, color: AdminColors.primary, bg: AdminColors.primaryLight, borderColor: AdminColors.border },
    { label: '활성 박스', value: stats.activeBoxes, unit: '개', icon: TrendingUp, color: '#10b981', bg: '#ecfdf5', borderColor: '#a7f3d0' },
    { label: '정지 박스', value: stats.suspendedBoxes, unit: '개', icon: AlertCircle, color: '#ef4444', bg: '#fef2f2', borderColor: '#fecaca' },
    {
      label: '전체 회원',
      value: stats.boxesWithCount.length > 0 ? stats.totalMembers : null,
      unit: '명',
      icon: Users,
      color: '#f59e0b',
      bg: '#fffbeb',
      borderColor: '#fde68a',
    },
  ];

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <AlertCircle size={40} color="#ef4444" style={{ marginBottom: '12px' }} />
        <p style={{ margin: '0 0 16px', fontSize: '15px', color: '#374151' }}>{error}</p>
        <button
          onClick={loadBoxes}
          style={{ padding: '9px 20px', border: 'none', borderRadius: '8px', background: AdminColors.primary, color: 'white', cursor: 'pointer', fontSize: '14px' }}
        >
          다시 시도
        </button>
      </div>
    );
  }

  const circumference = 2 * Math.PI * 54; // ≈ 339.3

  return (
    <div>
      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {summaryCards.map(({ label, value, unit, icon: Icon, color, bg, borderColor }) => (
          <div key={label} style={{
            background: 'white', border: `1px solid ${borderColor}`, borderRadius: '12px',
            padding: '22px 20px', display: 'flex', alignItems: 'center', gap: '16px',
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px', background: bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon size={22} color={color} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>{label}</div>
              {loading ? (
                <div style={{ width: '60px', height: '28px', background: '#f3f4f6', borderRadius: '6px', animation: 'pulse 1.5s ease-in-out infinite' }} />
              ) : (
                <div style={{ fontSize: '30px', fontWeight: '700', color: '#111827', lineHeight: 1 }}>
                  {value !== null && value !== undefined
                    ? <>{value}<span style={{ fontSize: '15px', fontWeight: '500', color: '#6b7280', marginLeft: '3px' }}>{unit}</span></>
                    : <span style={{ fontSize: '16px', color: '#9ca3af' }}>-</span>
                  }
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px' }}>
        {/* 회원 수 TOP 5 */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#111827' }}>회원 수 TOP 5 (활성 박스)</h3>
            <button
              onClick={() => navigate('/admin/boxes')}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px', border: 'none', background: 'transparent',
                color: AdminColors.accent, fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              }}
            >
              전체 보기 <ArrowRight size={13} />
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[...Array(3)].map((_, i) => (
                <div key={i}>
                  <div style={{ width: '100%', height: '18px', background: '#f3f4f6', borderRadius: '4px', marginBottom: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  <div style={{ width: '100%', height: '6px', background: '#f3f4f6', borderRadius: '3px', animation: 'pulse 1.5s ease-in-out infinite' }} />
                </div>
              ))}
            </div>
          ) : stats.topBoxes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
              <Users size={32} style={{ marginBottom: '8px', opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: '14px' }}>memberCount 데이터가 없습니다.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {stats.topBoxes.map((box, i) => {
                const pct = stats.maxMembers > 0 ? ((box.memberCount ?? 0) / stats.maxMembers) * 100 : 0;
                return (
                  <div
                    key={box.boxName}
                    onClick={() => navigate(`/admin/boxes/${box.boxName}`, { state: { box } })}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          width: '22px', height: '22px', borderRadius: '6px',
                          background: i === 0 ? '#fef3c7' : '#f3f4f6',
                          color: i === 0 ? '#d97706' : '#6b7280',
                          fontSize: '11px', fontWeight: '700',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {i + 1}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{box.boxName}</span>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: AdminColors.primary }}>{box.memberCount}명</span>
                    </div>
                    <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: i === 0 ? AdminColors.headerGradient : '#94a3b8',
                        borderRadius: '3px', transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 전체 박스 현황 */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '700', color: '#111827' }}>전체 박스 현황</h3>

          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r="54" fill="none" stroke="#f3f4f6" strokeWidth="18" />
                {!loading && stats.totalBoxes > 0 && (
                  <>
                    <circle
                      cx="70" cy="70" r="54" fill="none"
                      stroke="#1e293b" strokeWidth="18"
                      strokeDasharray={`${(stats.activeBoxes / stats.totalBoxes) * circumference} ${circumference}`}
                      strokeDashoffset={circumference * 0.25}
                      strokeLinecap="round"
                      transform="rotate(-90 70 70)"
                    />
                    {stats.suspendedBoxes > 0 && (
                      <circle
                        cx="70" cy="70" r="54" fill="none"
                        stroke="#ef4444" strokeWidth="18"
                        strokeDasharray={`${(stats.suspendedBoxes / stats.totalBoxes) * circumference} ${circumference}`}
                        strokeDashoffset={circumference * 0.25 - (stats.activeBoxes / stats.totalBoxes) * circumference}
                        strokeLinecap="round"
                        transform="rotate(-90 70 70)"
                      />
                    )}
                  </>
                )}
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                {loading
                  ? <div style={{ width: '36px', height: '36px', background: '#f3f4f6', borderRadius: '50%', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  : <>
                      <div style={{ fontSize: '26px', fontWeight: '700', color: '#111827' }}>{stats.totalBoxes}</div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>전체</div>
                    </>
                }
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: '활성', value: stats.activeBoxes, color: '#1e293b' },
              { label: '정지', value: stats.suspendedBoxes, color: '#ef4444' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, display: 'inline-block' }} />
                  <span style={{ fontSize: '14px', color: '#374151' }}>{label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>{loading ? '-' : `${value}개`}</span>
                  {!loading && stats.totalBoxes > 0 && (
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>({Math.round((value / stats.totalBoxes) * 100)}%)</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>박스당 평균 회원</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>
              {loading ? '-' : stats.avgMembers !== null ? `${stats.avgMembers}명` : '-'}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
