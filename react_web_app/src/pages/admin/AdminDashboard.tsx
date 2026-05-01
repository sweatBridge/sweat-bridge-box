import { Building2, Users, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppColors } from '../../constants/colors';
import { MOCK_BOXES } from './_mockData';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const totalBoxes = MOCK_BOXES.length;
  const activeBoxes = MOCK_BOXES.filter((b) => b.status === 'active').length;
  const suspendedBoxes = MOCK_BOXES.filter((b) => b.status === 'suspended').length;
  const totalMembers = MOCK_BOXES.reduce((sum, b) => sum + b.memberCount, 0);

  const summaryCards = [
    { label: '전체 고객사', value: totalBoxes, unit: '개', icon: Building2, color: AppColors.primary, bg: '#eff6ff', borderColor: '#bfdbfe' },
    { label: '활성 박스', value: activeBoxes, unit: '개', icon: TrendingUp, color: '#10b981', bg: '#ecfdf5', borderColor: '#a7f3d0' },
    { label: '정지 박스', value: suspendedBoxes, unit: '개', icon: AlertCircle, color: '#ef4444', bg: '#fef2f2', borderColor: '#fecaca' },
    { label: '전체 회원', value: totalMembers, unit: '명', icon: Users, color: '#f59e0b', bg: '#fffbeb', borderColor: '#fde68a' },
  ];

  const topBoxes = [...MOCK_BOXES]
    .filter((b) => b.status === 'active')
    .sort((a, b) => b.memberCount - a.memberCount)
    .slice(0, 5);

  const maxMembers = Math.max(...topBoxes.map((b) => b.memberCount));

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
              <div style={{ fontSize: '30px', fontWeight: '700', color: '#111827', lineHeight: 1 }}>
                {value}<span style={{ fontSize: '15px', fontWeight: '500', color: '#6b7280', marginLeft: '3px' }}>{unit}</span>
              </div>
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
                color: AppColors.primary, fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              }}
            >
              전체 보기 <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {topBoxes.map((box, i) => {
              const pct = (box.memberCount / maxMembers) * 100;
              return (
                <div key={box.boxName} onClick={() => navigate(`/admin/boxes/${box.boxName}`)} style={{ cursor: 'pointer' }}>
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
                    <span style={{ fontSize: '14px', fontWeight: '700', color: AppColors.primary }}>{box.memberCount}명</span>
                  </div>
                  <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`,
                      background: i === 0
                        ? `linear-gradient(90deg, ${AppColors.primary}, #1d4ed8)`
                        : '#93c5fd',
                      borderRadius: '3px', transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 전체 박스 현황 */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '700', color: '#111827' }}>전체 박스 현황</h3>

          {/* 도넛 대체 시각화 */}
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r="54" fill="none" stroke="#f3f4f6" strokeWidth="18" />
                <circle
                  cx="70" cy="70" r="54" fill="none"
                  stroke={AppColors.primary} strokeWidth="18"
                  strokeDasharray={`${(activeBoxes / totalBoxes) * 339.3} 339.3`}
                  strokeDashoffset="84.8"
                  strokeLinecap="round"
                  transform="rotate(-90 70 70)"
                />
                {suspendedBoxes > 0 && (
                  <circle
                    cx="70" cy="70" r="54" fill="none"
                    stroke="#ef4444" strokeWidth="18"
                    strokeDasharray={`${(suspendedBoxes / totalBoxes) * 339.3} 339.3`}
                    strokeDashoffset={`${84.8 - (activeBoxes / totalBoxes) * 339.3}`}
                    strokeLinecap="round"
                    transform="rotate(-90 70 70)"
                  />
                )}
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ fontSize: '26px', fontWeight: '700', color: '#111827' }}>{totalBoxes}</div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>전체</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: '활성', value: activeBoxes, color: AppColors.primary },
              { label: '정지', value: suspendedBoxes, color: '#ef4444' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, display: 'inline-block' }} />
                  <span style={{ fontSize: '14px', color: '#374151' }}>{label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>{value}개</span>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>({Math.round((value / totalBoxes) * 100)}%)</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>박스당 평균 회원</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>
              {Math.round(totalMembers / totalBoxes)}명
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
