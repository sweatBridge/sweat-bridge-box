import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, ArrowLeft, CheckCircle, MapPin, Users, Plus, Trash2,
  Building, Mail, Phone, User, Search,
} from 'lucide-react';
import { AdminColors } from '../../constants/adminColors';
import { BoxInfo, Coach } from '../../types/box';
import { AdminBoxRepository } from '../../repositories/adminBoxRepository';
import { formatPhoneNumber, normalizePhoneNumber } from '../../utils/phoneUtils';

declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: { zonecode: string; roadAddress: string }) => void;
      }) => { open: () => void };
    };
  }
}

const INITIAL_FORM: BoxInfo = {
  boxName: '',
  email: '',
  representative: '',
  phone: '',
  address: { zoneCode: '', roadAddress: '', detailAddress: '' },
  description: '',
  coaches: [],
  status: 'active',
  memberCount: 0,
};

const INITIAL_COACH: Coach = { name: '', phone: '', email: '' };

// ────── 공통 input 스타일 ──────
const inputStyle = (readonly = false): React.CSSProperties => ({
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  color: readonly ? '#6b7280' : '#111827',
  background: readonly ? '#f9fafb' : 'white',
  cursor: readonly ? 'not-allowed' : 'text',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
});

const inputWithIconStyle: React.CSSProperties = {
  ...inputStyle(),
  paddingLeft: '40px',
};

interface SectionProps {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

const Section = ({ icon: Icon, title, children, action }: SectionProps) => (
  <div style={{
    background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px',
    overflow: 'hidden', marginBottom: '16px',
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 20px',
      background: AdminColors.headerGradient,
      color: 'white',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '15px' }}>
        <Icon size={18} />
        {title}
      </div>
      {action}
    </div>
    <div style={{ padding: '24px 20px' }}>{children}</div>
  </div>
);

const FormGrid = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>{children}</div>
);

const FormGroup = ({
  label, required, fullWidth, children,
}: { label: string; required?: boolean; fullWidth?: boolean; children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: fullWidth ? '1 / -1' : undefined }}>
    <label style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
      {label}{required && <span style={{ color: '#ef4444', marginLeft: '3px' }}>*</span>}
    </label>
    {children}
  </div>
);

const InputWithIcon = ({
  icon: Icon, value, onChange, placeholder, type = 'text', readonly = false,
}: {
  icon: React.ElementType; value: string; onChange?: (v: string) => void;
  placeholder?: string; type?: string; readonly?: boolean;
}) => (
  <div style={{ position: 'relative' }}>
    <Icon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
    <input
      type={type}
      value={value}
      readOnly={readonly}
      placeholder={placeholder}
      onChange={(e) => onChange?.(e.target.value)}
      style={inputWithIconStyle}
      onFocus={(e) => { if (!readonly) { e.target.style.borderColor = AdminColors.primary; e.target.style.boxShadow = '0 0 0 3px rgba(49,130,246,0.1)'; } }}
      onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
    />
  </div>
);

const AdminBoxOnboarding = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<BoxInfo>(INITIAL_FORM);
  const [newCoach, setNewCoach] = useState<Coach>(INITIAL_COACH);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = useCallback((field: string, value: string) => {
    if (field.startsWith('address.')) {
      const key = field.split('.')[1];
      setForm((f) => ({ ...f, address: { ...f.address, [key]: value } }));
    } else {
      setForm((f) => ({ ...f, [field]: value }));
    }
    setErrors((e) => { const next = { ...e }; delete next[field]; return next; });
  }, []);

  const handlePostcode = useCallback(() => {
    if (window.daum) {
      new window.daum.Postcode({
        oncomplete: (data) => {
          setForm((f) => ({ ...f, address: { ...f.address, zoneCode: data.zonecode, roadAddress: data.roadAddress } }));
          setErrors((e) => { const next = { ...e }; delete next['address.roadAddress']; return next; });
        },
      }).open();
    }
  }, []);

  const handleAddCoach = useCallback(() => {
    if (!newCoach.name.trim() || !newCoach.phone.trim() || !newCoach.email.trim()) return;
    setForm((f) => ({ ...f, coaches: [...f.coaches, { ...newCoach, phone: normalizePhoneNumber(newCoach.phone) }] }));
    setNewCoach(INITIAL_COACH);
  }, [newCoach]);

  const handleRemoveCoach = useCallback((idx: number) => {
    setForm((f) => ({ ...f, coaches: f.coaches.filter((_, i) => i !== idx) }));
  }, []);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.boxName.trim()) errs.boxName = '박스명(ID)을 입력하세요.';
    else if (/\s/.test(form.boxName)) errs.boxName = '공백을 포함할 수 없습니다.';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = '유효한 이메일을 입력하세요.';
    if (!form.representative.trim()) errs.representative = '대표 코치를 입력하세요.';
    if (!form.phone.trim()) errs.phone = '연락처를 입력하세요.';
    if (!form.address.roadAddress.trim()) errs['address.roadAddress'] = '주소를 검색하세요.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload: BoxInfo = {
        ...form,
        phone: normalizePhoneNumber(form.phone),
        createdAt: new Date().toISOString().split('T')[0],
        onboardedAt: new Date().toISOString().split('T')[0],
      };
      await AdminBoxRepository.createBox(payload);
      setSubmitted(true);
    } catch (err) {
      setSubmitError('고객사 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── 완료 화면 ──
  if (submitted) {
    return (
      <div style={{ maxWidth: '480px', margin: '60px auto', textAlign: 'center' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%', background: '#d1fae5',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
        }}>
          <CheckCircle size={36} color="#10b981" />
        </div>
        <h2 style={{ margin: '0 0 12px', fontSize: '22px', fontWeight: '700', color: '#111827' }}>등록 완료</h2>
        <p style={{ margin: '0 0 6px', fontSize: '15px', color: '#6b7280' }}>
          <strong style={{ color: '#111827' }}>{form.boxName}</strong>이(가) 등록되었습니다.
        </p>
        <p style={{ margin: '0 0 32px', fontSize: '13px', color: '#9ca3af' }}>
          박스 문서 및 하위 컬렉션 초기화가 완료되었습니다.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => { setForm(INITIAL_FORM); setSubmitted(false); }}
            style={{ padding: '11px 22px', border: '1px solid #d1d5db', borderRadius: '8px', background: 'white', color: '#374151', fontSize: '14px', cursor: 'pointer' }}
          >
            추가 등록
          </button>
          <button
            onClick={() => navigate('/admin/boxes')}
            style={{ padding: '11px 26px', border: 'none', borderRadius: '8px', background: AdminColors.primary, color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
          >
            목록으로 이동
          </button>
        </div>
      </div>
    );
  }

  // ── 등록 폼 ──
  return (
    <div>
      <button
        onClick={() => navigate('/admin/boxes')}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', border: 'none', background: 'transparent', color: '#6b7280', fontSize: '14px', cursor: 'pointer', marginBottom: '20px', padding: 0 }}
      >
        <ArrowLeft size={16} />
        고객사 목록으로
      </button>

      <form onSubmit={handleSubmit}>
        {/* ── 기본 정보 ── */}
        <Section icon={Building} title="기본 정보">
          <FormGrid>
            <FormGroup label="박스명 (ID)" required>
              <InputWithIcon icon={Building2} value={form.boxName} onChange={(v) => update('boxName', v)} placeholder="SWEAT_BOX (고유 식별자, 변경 불가)" />
              {errors.boxName && <span style={{ fontSize: '12px', color: '#ef4444' }}>{errors.boxName}</span>}
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>영문 대문자, 숫자, 언더스코어 권장. 한번 설정하면 변경할 수 없습니다.</span>
            </FormGroup>

            <FormGroup label="이메일" required>
              <InputWithIcon icon={Mail} value={form.email} onChange={(v) => update('email', v)} placeholder="box@example.com" type="email" />
              {errors.email && <span style={{ fontSize: '12px', color: '#ef4444' }}>{errors.email}</span>}
            </FormGroup>

            <FormGroup label="대표 코치" required>
              <InputWithIcon icon={User} value={form.representative} onChange={(v) => update('representative', v)} placeholder="대표 코치 이름" />
              {errors.representative && <span style={{ fontSize: '12px', color: '#ef4444' }}>{errors.representative}</span>}
            </FormGroup>

            <FormGroup label="연락처" required>
              <InputWithIcon
                icon={Phone}
                value={formatPhoneNumber(form.phone)}
                onChange={(v) => update('phone', normalizePhoneNumber(v))}
                placeholder="'-' 제외 숫자만 입력"
              />
              {errors.phone && <span style={{ fontSize: '12px', color: '#ef4444' }}>{errors.phone}</span>}
            </FormGroup>
          </FormGrid>
        </Section>

        {/* ── 주소 ── */}
        <Section
          icon={MapPin}
          title="주소"
          action={
            <button
              type="button"
              onClick={handlePostcode}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '5px 12px', borderRadius: '6px',
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                color: 'white', fontSize: '13px', cursor: 'pointer',
              }}
            >
              <Search size={13} />
              주소 검색
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ maxWidth: '300px' }}>
              <FormGroup label="우편번호">
                <input value={form.address.zoneCode} readOnly placeholder="주소 검색 시 자동 입력" style={inputStyle(true)} />
              </FormGroup>
            </div>

            <FormGroup label="도로명 주소" required fullWidth>
              <input value={form.address.roadAddress} readOnly placeholder="주소 검색 버튼을 눌러주세요" style={inputStyle(true)} />
              {errors['address.roadAddress'] && <span style={{ fontSize: '12px', color: '#ef4444' }}>{errors['address.roadAddress']}</span>}
            </FormGroup>

            <FormGroup label="상세 주소" fullWidth>
              <input
                value={form.address.detailAddress}
                onChange={(e) => update('address.detailAddress', e.target.value)}
                placeholder="상세 주소를 입력하세요"
                style={inputStyle()}
                onFocus={(e) => { e.target.style.borderColor = AdminColors.primary; e.target.style.boxShadow = '0 0 0 3px rgba(49,130,246,0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
              />
            </FormGroup>
          </div>
        </Section>

        {/* ── 코치진 ── */}
        <Section icon={Users} title="코치진">
          {/* 코치 추가 행 */}
          <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '8px', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}>
              <FormGroup label="이름">
                <input
                  value={newCoach.name}
                  onChange={(e) => setNewCoach((c) => ({ ...c, name: e.target.value }))}
                  placeholder="코치 이름"
                  style={inputStyle()}
                  onFocus={(e) => { e.target.style.borderColor = AdminColors.primary; }}
                  onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; }}
                />
              </FormGroup>
              <FormGroup label="연락처">
                <input
                  value={formatPhoneNumber(newCoach.phone)}
                  onChange={(e) => setNewCoach((c) => ({ ...c, phone: normalizePhoneNumber(e.target.value) }))}
                  placeholder="01012345678"
                  style={inputStyle()}
                  onFocus={(e) => { e.target.style.borderColor = AdminColors.primary; }}
                  onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; }}
                />
              </FormGroup>
              <FormGroup label="이메일">
                <input
                  value={newCoach.email}
                  onChange={(e) => setNewCoach((c) => ({ ...c, email: e.target.value }))}
                  placeholder="coach@example.com"
                  style={inputStyle()}
                  onFocus={(e) => { e.target.style.borderColor = AdminColors.primary; }}
                  onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; }}
                />
              </FormGroup>
              <button
                type="button"
                onClick={handleAddCoach}
                disabled={!newCoach.name.trim() || !newCoach.phone.trim() || !newCoach.email.trim()}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '10px 16px', border: 'none', borderRadius: '6px',
                  background: AdminColors.primary, color: 'white', fontSize: '14px',
                  cursor: 'pointer', whiteSpace: 'nowrap', marginTop: '22px',
                  opacity: (!newCoach.name.trim() || !newCoach.phone.trim() || !newCoach.email.trim()) ? 0.5 : 1,
                }}
              >
                <Plus size={15} />
                추가
              </button>
            </div>
          </div>

          {/* 코치 목록 */}
          {form.coaches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
              <Users size={36} style={{ marginBottom: '10px', opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: '14px' }}>등록된 코치가 없습니다. 위 폼에서 추가해주세요.</p>
            </div>
          ) : (
            <div>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 60px',
                gap: '12px', padding: '12px 16px',
                background: '#f8fafc', borderRadius: '6px',
                fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '4px',
              }}>
                <div>이름</div><div>연락처</div><div>이메일</div><div />
              </div>
              {form.coaches.map((coach, i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 60px',
                    gap: '12px', padding: '13px 16px',
                    borderBottom: i < form.coaches.length - 1 ? '1px solid #f3f4f6' : 'none',
                    alignItems: 'center', fontSize: '14px', color: '#374151',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '26px', height: '26px', borderRadius: '50%',
                      background: AdminColors.headerGradient, color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <User size={13} />
                    </div>
                    {coach.name}
                  </div>
                  <div>{formatPhoneNumber(coach.phone)}</div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>{coach.email}</div>
                  <div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCoach(i)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '5px 8px', border: 'none', borderRadius: '6px',
                        background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontSize: '12px',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── 박스 소개 ── */}
        <Section icon={Building2} title="박스 소개">
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="박스 소개 문구를 입력하세요."
            rows={4}
            style={{
              width: '100%', padding: '12px', border: '1px solid #d1d5db',
              borderRadius: '6px', fontSize: '14px', color: '#111827',
              fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', outline: 'none',
            }}
            onFocus={(e) => { e.target.style.borderColor = AdminColors.primary; e.target.style.boxShadow = '0 0 0 3px rgba(49,130,246,0.1)'; }}
            onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
          />
        </Section>

        {/* ── 에러 & 제출 ── */}
        {submitError && (
          <div style={{
            marginBottom: '16px', padding: '12px 16px', borderRadius: '8px',
            background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '14px',
          }}>
            {submitError}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => navigate('/admin/boxes')}
            style={{ padding: '11px 22px', border: '1px solid #d1d5db', borderRadius: '8px', background: 'white', color: '#374151', fontSize: '14px', cursor: 'pointer' }}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '11px 28px', border: 'none', borderRadius: '8px',
              background: AdminColors.primary, color: 'white', fontSize: '14px', fontWeight: '600',
              cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1,
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            {submitting && (
              <div style={{
                width: '14px', height: '14px',
                border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white',
                borderRadius: '50%', animation: 'spin 1s linear infinite',
              }} />
            )}
            {submitting ? '등록 중...' : '고객사 등록'}
          </button>
        </div>
      </form>
      <style>{`@keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }`}</style>
    </div>
  );
};

export default AdminBoxOnboarding;
