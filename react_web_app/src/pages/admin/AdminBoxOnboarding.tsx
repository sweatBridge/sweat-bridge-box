import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowLeft, CheckCircle } from 'lucide-react';
import { AppColors } from '../../constants/colors';

interface FormData {
  boxName: string;
  representative: string;
  email: string;
  phone: string;
  roadAddress: string;
  detailAddress: string;
  description: string;
}

const INITIAL: FormData = {
  boxName: '',
  representative: '',
  email: '',
  phone: '',
  roadAddress: '',
  detailAddress: '',
  description: '',
};

const Field = ({
  label, value, onChange, placeholder, type = 'text', required = false, hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  hint?: string;
}) => (
  <div style={{ marginBottom: '20px' }}>
    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
      {label}{required && <span style={{ color: '#ef4444', marginLeft: '3px' }}>*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '10px 14px', border: '1px solid #d1d5db',
        borderRadius: '8px', fontSize: '14px', color: '#111827',
        outline: 'none', transition: 'border-color 0.2s', background: 'white',
        boxSizing: 'border-box',
      }}
      onFocus={(e) => (e.target.style.borderColor = AppColors.primary)}
      onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
    />
    {hint && <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#9ca3af' }}>{hint}</p>}
  </div>
);

const AdminBoxOnboarding = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>(INITIAL);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const update = (key: keyof FormData) => (val: string) => setForm((f) => ({ ...f, [key]: val }));

  const validate = (): boolean => {
    const errs: Partial<FormData> = {};
    if (!form.boxName.trim()) errs.boxName = '필수 입력';
    if (!form.representative.trim()) errs.representative = '필수 입력';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = '유효한 이메일 형식 필요';
    if (!form.phone.trim()) errs.phone = '필수 입력';
    if (!form.roadAddress.trim()) errs.roadAddress = '필수 입력';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: '480px', margin: '60px auto', textAlign: 'center' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%', background: '#d1fae5',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
        }}>
          <CheckCircle size={36} color="#10b981" />
        </div>
        <h2 style={{ margin: '0 0 12px', fontSize: '22px', fontWeight: '700', color: '#111827' }}>
          온보딩 완료
        </h2>
        <p style={{ margin: '0 0 8px', fontSize: '15px', color: '#6b7280' }}>
          <strong style={{ color: '#111827' }}>{form.boxName}</strong>이(가) 등록되었습니다.
        </p>
        <p style={{ margin: '0 0 32px', fontSize: '13px', color: '#9ca3af' }}>
          Firebase 연동 시 Firestore에 초기 스키마가 생성됩니다.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => { setForm(INITIAL); setSubmitted(false); }}
            style={{
              padding: '11px 22px', border: '1px solid #d1d5db',
              borderRadius: '8px', background: 'white', color: '#374151',
              fontSize: '14px', cursor: 'pointer',
            }}
          >
            추가 등록
          </button>
          <button
            onClick={() => navigate('/admin/boxes')}
            style={{
              padding: '11px 22px', border: 'none',
              borderRadius: '8px', background: AppColors.primary, color: 'white',
              fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            }}
          >
            목록으로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '680px' }}>
      <button
        onClick={() => navigate('/admin/boxes')}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px', border: 'none',
          background: 'transparent', color: '#6b7280', fontSize: '14px',
          cursor: 'pointer', marginBottom: '20px', padding: 0,
        }}
      >
        <ArrowLeft size={16} />
        고객사 목록으로
      </button>

      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '10px', background: '#eff6ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Building2 size={22} color={AppColors.primary} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>신규 고객사 등록</h2>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#9ca3af' }}>아래 정보를 입력하면 박스를 생성합니다.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 기본 정보 */}
          <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #f3f4f6' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>기본 정보</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
              <div>
                <Field label="박스명 (ID)" value={form.boxName} onChange={update('boxName')} placeholder="SWEAT_BOX" required hint="영문 대문자, 숫자, 언더스코어 권장 (고유 식별자)" />
                {errors.boxName && <p style={{ color: '#ef4444', fontSize: '12px', margin: '-14px 0 14px' }}>{errors.boxName}</p>}
              </div>
              <div>
                <Field label="대표자명" value={form.representative} onChange={update('representative')} placeholder="홍길동" required />
                {errors.representative && <p style={{ color: '#ef4444', fontSize: '12px', margin: '-14px 0 14px' }}>{errors.representative}</p>}
              </div>
              <div>
                <Field label="이메일" value={form.email} onChange={update('email')} placeholder="box@example.com" type="email" required />
                {errors.email && <p style={{ color: '#ef4444', fontSize: '12px', margin: '-14px 0 14px' }}>{errors.email}</p>}
              </div>
              <div>
                <Field label="전화번호" value={form.phone} onChange={update('phone')} placeholder="010-1234-5678" required />
                {errors.phone && <p style={{ color: '#ef4444', fontSize: '12px', margin: '-14px 0 14px' }}>{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* 주소 */}
          <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #f3f4f6' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>주소</h3>
            <div>
              <Field label="도로명 주소" value={form.roadAddress} onChange={update('roadAddress')} placeholder="서울시 강남구 테헤란로 1" required />
              {errors.roadAddress && <p style={{ color: '#ef4444', fontSize: '12px', margin: '-14px 0 14px' }}>{errors.roadAddress}</p>}
            </div>
            <Field label="상세 주소" value={form.detailAddress} onChange={update('detailAddress')} placeholder="2층 201호" />
          </div>

          {/* 설명 */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>설명</h3>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>박스 소개</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description')(e.target.value)}
              placeholder="고객사(박스)에 대한 간단한 설명을 입력하세요."
              rows={4}
              style={{
                width: '100%', padding: '10px 14px', border: '1px solid #d1d5db',
                borderRadius: '8px', fontSize: '14px', color: '#111827',
                outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = AppColors.primary)}
              onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => navigate('/admin/boxes')}
              style={{
                padding: '11px 22px', border: '1px solid #d1d5db',
                borderRadius: '8px', background: 'white', color: '#374151',
                fontSize: '14px', cursor: 'pointer',
              }}
            >
              취소
            </button>
            <button
              type="submit"
              style={{
                padding: '11px 26px', border: 'none',
                borderRadius: '8px', background: AppColors.primary, color: 'white',
                fontSize: '14px', fontWeight: '600', cursor: 'pointer',
              }}
            >
              박스 생성
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminBoxOnboarding;
