import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, Phone, MapPin, User, Check, X, AlertTriangle, AlertCircle } from 'lucide-react';
import { AdminColors } from '../../constants/adminColors';
import { BoxInfo, BoxStatus } from '../../types/box';
import { AdminBoxRepository } from '../../repositories/adminBoxRepository';

const StatusBadge = ({ status }: { status?: BoxStatus }) => {
  const resolved = status ?? 'active';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '5px 14px', borderRadius: '16px', fontSize: '13px', fontWeight: '600',
      background: resolved === 'active' ? '#d1fae5' : '#fee2e2',
      color: resolved === 'active' ? '#065f46' : '#991b1b',
    }}>
      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: resolved === 'active' ? '#10b981' : '#ef4444' }} />
      {resolved === 'active' ? '활성' : '정지'}
    </span>
  );
};

const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
  <div style={{ display: 'flex', gap: '14px', padding: '14px 0', borderBottom: '1px solid #f3f4f6' }}>
    <div style={{
      width: '36px', height: '36px', borderRadius: '8px', background: AdminColors.primaryLight,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Icon size={16} color={AdminColors.primary} />
    </div>
    <div>
      <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '14px', color: '#111827', fontWeight: '500' }}>{value || '-'}</div>
    </div>
  </div>
);

const AdminBoxDetail = () => {
  const { boxName } = useParams<{ boxName: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [box, setBox] = useState<BoxInfo | null>(
    (location.state as { box?: BoxInfo })?.box ?? null
  );
  const [loading, setLoading] = useState(!box);
  const [error, setError] = useState<string | null>(null);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<BoxStatus | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // 직접 URL 접근 시 단일 doc 조회
  useEffect(() => {
    if (box || !boxName) return;
    setLoading(true);
    AdminBoxRepository.listAllBoxes()
      .then((boxes) => {
        const found = boxes.find((b) => b.boxName === boxName) ?? null;
        setBox(found);
        if (!found) setError('박스를 찾을 수 없습니다.');
      })
      .catch(() => setError('박스 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [box, boxName]);

  const handleStatusChange = (newStatus: BoxStatus) => {
    setPendingStatus(newStatus);
    setShowStatusConfirm(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus || !boxName) return;
    setStatusUpdating(true);
    try {
      await AdminBoxRepository.updateBoxStatus(boxName, pendingStatus);
      setBox((prev) => prev ? { ...prev, status: pendingStatus } : prev);
    } catch {
      alert('상태 변경에 실패했습니다.');
    } finally {
      setStatusUpdating(false);
      setShowStatusConfirm(false);
      setPendingStatus(null);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#9ca3af' }}>
        <div style={{
          width: '32px', height: '32px', margin: '0 auto 12px',
          border: '3px solid #f3f4f6', borderTop: `3px solid ${AdminColors.primary}`,
          borderRadius: '50%', animation: 'spin 1s linear infinite',
        }} />
        <style>{`@keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  if (error || !box) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#9ca3af' }}>
        <AlertCircle size={40} color="#ef4444" style={{ marginBottom: '12px' }} />
        <p style={{ margin: '0 0 16px', fontSize: '15px', color: '#374151' }}>{error ?? '박스를 찾을 수 없습니다.'}</p>
        <button onClick={() => navigate('/admin/boxes')} style={{
          padding: '9px 20px', border: 'none', borderRadius: '8px',
          background: AdminColors.primary, color: 'white', cursor: 'pointer', fontSize: '14px',
        }}>
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const currentStatus = box.status ?? 'active';

  return (
    <div>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>
        {/* 기본 정보 */}
        <div>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '12px', background: AdminColors.primaryLight,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Building2 size={24} color={AdminColors.primary} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#111827' }}>{box.boxName}</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>{box.description || '-'}</p>
                </div>
              </div>
              <StatusBadge status={currentStatus} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <InfoRow icon={User} label="대표자" value={box.representative} />
              <InfoRow icon={Mail} label="이메일" value={box.email} />
              <InfoRow icon={Phone} label="전화번호" value={box.phone} />
              <InfoRow icon={MapPin} label="주소" value={box.address ? `${box.address.roadAddress} ${box.address.detailAddress}` : '-'} />
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px',
              marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f3f4f6',
            }}>
              {[
                { label: '등록 회원', value: box.memberCount !== undefined ? `${box.memberCount}명` : '-', color: AdminColors.primary },
                { label: '코치', value: `${box.coaches?.length ?? 0}명`, color: '#10b981' },
                { label: '등록일', value: box.createdAt ?? '-', color: '#6b7280' },
                { label: '상태', value: currentStatus === 'active' ? '활성' : '정지', color: currentStatus === 'active' ? '#10b981' : '#ef4444' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign: 'center', padding: '16px', background: '#f8fafc', borderRadius: '10px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color, marginBottom: '4px' }}>{value}</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 코치 목록 */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: '#111827' }}>코치 목록</h3>
            {!box.coaches?.length ? (
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>등록된 코치가 없습니다.</p>
            ) : (
              box.coaches.map((coach, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 0', borderBottom: i < box.coaches.length - 1 ? '1px solid #f3f4f6' : 'none',
                }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: `hsl(${(i * 60 + 200) % 360},70%,85%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: '700',
                    color: `hsl(${(i * 60 + 200) % 360},50%,35%)`,
                    flexShrink: 0,
                  }}>
                    {coach.name?.[0] ?? '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{coach.name}</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>{coach.email}</div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>{coach.phone}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 운영 상태 관리 */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: '#111827' }}>운영 상태 관리</h3>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>현재 상태</div>
            <StatusBadge status={currentStatus} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(['active', 'suspended'] as BoxStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={currentStatus === s}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '12px 16px', borderRadius: '8px', border: '1px solid',
                  borderColor: currentStatus === s ? '#d1d5db' : s === 'active' ? '#10b981' : '#ef4444',
                  background: currentStatus === s ? '#f9fafb' : s === 'active' ? '#ecfdf5' : '#fef2f2',
                  color: currentStatus === s ? '#9ca3af' : s === 'active' ? '#065f46' : '#991b1b',
                  fontSize: '14px', fontWeight: '600',
                  cursor: currentStatus === s ? 'default' : 'pointer',
                  opacity: currentStatus === s ? 0.6 : 1,
                }}
              >
                {s === 'active' ? <Check size={16} /> : <X size={16} />}
                {s === 'active' ? '활성화' : '정지'}
              </button>
            ))}
          </div>

          <div style={{
            marginTop: '16px', padding: '12px', background: '#fffbeb',
            borderRadius: '8px', border: '1px solid #fde68a', display: 'flex', gap: '8px',
          }}>
            <AlertTriangle size={14} color="#d97706" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ margin: 0, fontSize: '12px', color: '#92400e', lineHeight: '1.5' }}>
              정지 상태의 박스는 코치 로그인 차단 여부를 별도로 설정해야 합니다.
            </p>
          </div>
        </div>
      </div>

      {/* 상태 변경 확인 모달 */}
      {showStatusConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
          onClick={() => !statusUpdating && setShowStatusConfirm(false)}
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
                disabled={statusUpdating}
                style={{ padding: '9px 18px', border: '1px solid #d1d5db', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '14px' }}
              >
                취소
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={statusUpdating}
                style={{
                  padding: '9px 18px', border: 'none', borderRadius: '8px',
                  background: pendingStatus === 'active' ? '#10b981' : '#ef4444',
                  color: 'white', cursor: statusUpdating ? 'not-allowed' : 'pointer',
                  fontSize: '14px', fontWeight: '600', opacity: statusUpdating ? 0.7 : 1,
                }}
              >
                {statusUpdating ? '변경 중...' : '변경'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBoxDetail;
