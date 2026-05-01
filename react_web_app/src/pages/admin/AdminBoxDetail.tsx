import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Users, Mail, Phone, MapPin, User, Edit2, Check, X, AlertTriangle } from 'lucide-react';
import { AppColors } from '../../constants/colors';
import { MOCK_BOXES, AdminBoxSummary } from './_mockData';
import { BoxStatus } from '../../types/box';

const StatusBadge = ({ status }: { status: BoxStatus }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '5px 14px', borderRadius: '16px', fontSize: '13px', fontWeight: '600',
    background: status === 'active' ? '#d1fae5' : '#fee2e2',
    color: status === 'active' ? '#065f46' : '#991b1b',
  }}>
    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: status === 'active' ? '#10b981' : '#ef4444' }} />
    {status === 'active' ? '활성' : '정지'}
  </span>
);

const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
  <div style={{ display: 'flex', gap: '14px', padding: '14px 0', borderBottom: '1px solid #f3f4f6' }}>
    <div style={{
      width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Icon size={16} color={AppColors.primary} />
    </div>
    <div>
      <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '14px', color: '#111827', fontWeight: '500' }}>{value}</div>
    </div>
  </div>
);

const AdminBoxDetail = () => {
  const { boxName } = useParams<{ boxName: string }>();
  const navigate = useNavigate();

  const [boxes, setBoxes] = useState<AdminBoxSummary[]>(MOCK_BOXES);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<BoxStatus | null>(null);

  const box = boxes.find((b) => b.boxName === boxName);

  if (!box) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#9ca3af' }}>
        <Building2 size={48} style={{ marginBottom: '16px', opacity: 0.4 }} />
        <p style={{ margin: 0, fontSize: '16px' }}>박스를 찾을 수 없습니다.</p>
        <button onClick={() => navigate('/admin/boxes')} style={{
          marginTop: '20px', padding: '10px 20px', borderRadius: '8px',
          border: 'none', background: AppColors.primary, color: 'white', cursor: 'pointer',
        }}>
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const currentStatus = box.status || 'active';

  const handleStatusChange = (newStatus: BoxStatus) => {
    setPendingStatus(newStatus);
    setShowStatusConfirm(true);
  };

  const confirmStatusChange = () => {
    if (!pendingStatus) return;
    setBoxes((prev) => prev.map((b) => b.boxName === boxName ? { ...b, status: pendingStatus } : b));
    setShowStatusConfirm(false);
    setPendingStatus(null);
  };

  return (
    <div>
      {/* 뒤로가기 */}
      <button
        onClick={() => navigate('/admin/boxes')}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          border: 'none', background: 'transparent', color: '#6b7280',
          fontSize: '14px', cursor: 'pointer', marginBottom: '20px', padding: 0,
        }}
      >
        <ArrowLeft size={16} />
        고객사 목록으로
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>
        {/* 왼쪽: 기본 정보 */}
        <div>
          {/* 박스 헤더 */}
          <div style={{
            background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px',
            padding: '24px', marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '12px',
                  background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Building2 size={24} color={AppColors.primary} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#111827' }}>{box.boxName}</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>{box.description}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <StatusBadge status={currentStatus} />
                <button style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 14px', border: '1px solid #e5e7eb',
                  borderRadius: '8px', background: 'white', color: '#374151',
                  fontSize: '13px', cursor: 'pointer',
                }}>
                  <Edit2 size={13} />
                  수정
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <InfoRow icon={User} label="대표자" value={box.representative} />
              <InfoRow icon={Mail} label="이메일" value={box.email} />
              <InfoRow icon={Phone} label="전화번호" value={box.phone} />
              <InfoRow icon={MapPin} label="주소" value={`${box.address.roadAddress} ${box.address.detailAddress}`} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f3f4f6' }}>
              {[
                { label: '등록 회원', value: `${box.memberCount}명`, color: AppColors.primary },
                { label: '코치', value: `${box.coaches.length}명`, color: '#10b981' },
                { label: '등록일', value: box.createdAt || '-', color: '#6b7280' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  textAlign: 'center', padding: '16px', background: '#f8fafc', borderRadius: '10px',
                }}>
                  <div style={{ fontSize: '22px', fontWeight: '700', color, marginBottom: '4px' }}>{value}</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 코치 목록 */}
          <div style={{
            background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px',
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: '#111827' }}>
              코치 목록
            </h3>
            {box.coaches.map((coach, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 0', borderBottom: i < box.coaches.length - 1 ? '1px solid #f3f4f6' : 'none',
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: `hsl(${(i * 60 + 200) % 360},70%,85%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: '700', color: `hsl(${(i * 60 + 200) % 360},50%,35%)`,
                  flexShrink: 0,
                }}>
                  {coach.name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{coach.name}</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>{coach.email}</div>
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>{coach.phone}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 오른쪽: 운영 상태 관리 */}
        <div>
          <div style={{
            background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px',
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: '#111827' }}>
              운영 상태 관리
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>현재 상태</div>
              <StatusBadge status={currentStatus} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => handleStatusChange('active')}
                disabled={currentStatus === 'active'}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '12px 16px', borderRadius: '8px', border: '1px solid',
                  borderColor: currentStatus === 'active' ? '#d1d5db' : '#10b981',
                  background: currentStatus === 'active' ? '#f9fafb' : '#ecfdf5',
                  color: currentStatus === 'active' ? '#9ca3af' : '#065f46',
                  fontSize: '14px', fontWeight: '600', cursor: currentStatus === 'active' ? 'default' : 'pointer',
                  opacity: currentStatus === 'active' ? 0.6 : 1,
                }}
              >
                <Check size={16} />
                활성화
              </button>
              <button
                onClick={() => handleStatusChange('suspended')}
                disabled={currentStatus === 'suspended'}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '12px 16px', borderRadius: '8px', border: '1px solid',
                  borderColor: currentStatus === 'suspended' ? '#d1d5db' : '#ef4444',
                  background: currentStatus === 'suspended' ? '#f9fafb' : '#fef2f2',
                  color: currentStatus === 'suspended' ? '#9ca3af' : '#991b1b',
                  fontSize: '14px', fontWeight: '600', cursor: currentStatus === 'suspended' ? 'default' : 'pointer',
                  opacity: currentStatus === 'suspended' ? 0.6 : 1,
                }}
              >
                <X size={16} />
                정지
              </button>
            </div>

            <div style={{
              marginTop: '16px', padding: '12px', background: '#fffbeb',
              borderRadius: '8px', border: '1px solid #fde68a',
              display: 'flex', gap: '8px',
            }}>
              <AlertTriangle size={14} color="#d97706" style={{ flexShrink: 0, marginTop: '1px' }} />
              <p style={{ margin: 0, fontSize: '12px', color: '#92400e', lineHeight: '1.5' }}>
                정지 상태의 박스는 코치 로그인 차단 여부를 별도로 설정해야 합니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 상태 변경 확인 모달 */}
      {showStatusConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
          onClick={() => setShowStatusConfirm(false)}
        >
          <div
            style={{ background: 'white', padding: '28px', borderRadius: '12px', width: '380px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: '700' }}>상태 변경 확인</h3>
            <p style={{ margin: '0 0 24px', color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
              <strong>{box.boxName}</strong>의 상태를{' '}
              <strong style={{ color: pendingStatus === 'active' ? '#10b981' : '#ef4444' }}>
                {pendingStatus === 'active' ? '활성' : '정지'}
              </strong>으로 변경하시겠습니까?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowStatusConfirm(false)}
                style={{ padding: '9px 18px', border: '1px solid #d1d5db', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '14px' }}
              >
                취소
              </button>
              <button
                onClick={confirmStatusChange}
                style={{
                  padding: '9px 18px', border: 'none', borderRadius: '8px',
                  background: pendingStatus === 'active' ? '#10b981' : '#ef4444',
                  color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                }}
              >
                변경
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBoxDetail;
