import { useState } from 'react';
import { Gradients } from '../../../constants/gradients';
import { X, Calendar } from 'lucide-react';
import { MembershipService } from '../../../services/membershipService';
import { LockerService } from '../../../services/lockerService';
import { MemberService } from '../../../services/memberService';

interface ExtendAllModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

type ExtensionType = 'membership' | 'locker' | 'both';

const ExtendAllModal = ({ visible, onClose, onSuccess, onError }: ExtendAllModalProps) => {
  const [extensionType, setExtensionType] = useState<ExtensionType>('membership');
  const [days, setDays] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    extensionType?: string;
    days?: string;
    reason?: string;
  }>({});

  // 연장 일수 검증 공통 함수
  const validateDays = (daysValue: string): string | undefined => {
    if (!daysValue || daysValue.trim() === '') {
      return '연장 일수를 입력해주세요.';
    }
    const daysNum = parseInt(daysValue, 10);
    if (isNaN(daysNum)) {
      return '연장 일수는 숫자만 입력 가능합니다.';
    }
    if (daysNum < 1) {
      return '연장 일수는 최소 1일 이상이어야 합니다.';
    }
    if (daysNum > 365) {
      return '연장 일수는 최대 365일까지 입력 가능합니다.';
    }
    return undefined;
  };

  // 연장 사유 검증 공통 함수
  const validateReason = (reasonValue: string): string | undefined => {
    if (!reasonValue.trim()) {
      return '연장 사유를 입력해주세요.';
    }
    if (reasonValue.length > 100) {
      return '연장 사유는 100글자 이내로 입력해주세요.';
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: {
      extensionType?: string;
      days?: string;
      reason?: string;
    } = {};

    // 연장 대상 선택 필수
    if (!extensionType) {
      newErrors.extensionType = '연장 대상을 선택해주세요.';
    }

    // 연장 일수 검증
    const daysError = validateDays(days);
    if (daysError) {
      newErrors.days = daysError;
    }

    // 연장 사유 검증
    const reasonError = validateReason(reason);
    if (reasonError) {
      newErrors.reason = reasonError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleExecute = async () => {
    // 유효성 검사
    if (!validateForm()) {
      return;
    }

    const daysNum = parseInt(days, 10);

    if (!window.confirm('전체 연장을 실행하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      setLoading(true);
      const boxName = localStorage.getItem('boxName') || 'SWEAT';
      const assignee = localStorage.getItem('realName') || 'system';

      let membershipCount = 0;
      let lockerCount = 0;

      // 회원권 연장
      if (extensionType === 'membership' || extensionType === 'both') {
        const result = await MembershipService.extendAllMemberships(daysNum, reason, assignee);
        membershipCount = result.extendedCount;
      }

      // 락커 연장
      if (extensionType === 'locker' || extensionType === 'both') {
        const result = await LockerService.extendAllLockers(boxName, daysNum);
        lockerCount = result.extendedCount;
        
        // 연장된 락커의 회원 히스토리 업데이트 — 병렬 처리.
        // 개별 실패는 로그만 남기고 다른 항목 진행에 영향을 주지 않게 catch.
        if (result.extendedLockers && result.extendedLockers.length > 0) {
          await Promise.all(
            result.extendedLockers.map((locker) =>
              MemberService.updateLockerHistoryEndDate(
                boxName,
                locker.id,
                locker.key,
                locker.endDate
              ).catch((error) => {
                console.error(`Failed to update locker history for ${locker.id}:`, error);
              })
            )
          );
        }
      }

      // 성공 메시지 생성
      let message = '';
      if (extensionType === 'membership') {
        message = `회원권(${membershipCount}개) 전체 ${daysNum}일 연장되었습니다.`;
      } else if (extensionType === 'locker') {
        message = `락커(${lockerCount}개) 전체 ${daysNum}일 연장되었습니다.`;
      } else {
        message = `회원권(${membershipCount}개) + 락커(${lockerCount}개) 전체 ${daysNum}일 연장되었습니다.`;
      }

      // 폼 초기화
      setDays('');
      setReason('');
      setExtensionType('membership');
      setErrors({});

      if (onSuccess) {
        onSuccess(message);
      }
      onClose();
    } catch (error) {
      console.error('Failed to extend all:', error);
      if (onError) {
        onError('연장 처리 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <Calendar size={20} />
            전체 연장
          </h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* 연장 타입 선택 */}
          <div className="form-section">
            <label className="form-label">연장 대상 <span className="required">*</span></label>
            {errors.extensionType && (
              <div className="error-message">{errors.extensionType}</div>
            )}
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="extensionType"
                  value="membership"
                  checked={extensionType === 'membership'}
                  onChange={(e) => setExtensionType(e.target.value as ExtensionType)}
                />
                <span className="radio-label">
                  <div className="radio-icon">회원권</div>
                </span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="extensionType"
                  value="locker"
                  checked={extensionType === 'locker'}
                  onChange={(e) => setExtensionType(e.target.value as ExtensionType)}
                />
                <span className="radio-label">
                  <div className="radio-icon">락커</div>
                </span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="extensionType"
                  value="both"
                  checked={extensionType === 'both'}
                  onChange={(e) => setExtensionType(e.target.value as ExtensionType)}
                />
                <span className="radio-label">
                  <div className="radio-icon">회원권 + 락커</div>
                </span>
              </label>
            </div>
          </div>

          {/* 안내 메시지 */}
          <div className="info-box">
            안내: 현재 유효한 회원권/사용중인 락커만 연장됩니다.
          </div>

          {/* 연장 일수 */}
          <div className="form-section">
            <label className="form-label">연장 일수 <span className="required">*</span></label>
            {errors.days && (
              <div className="error-message">{errors.days}</div>
            )}
            <input
              type="number"
              min="1"
              max="365"
              placeholder="연장할 일수를 입력하세요 (예: 7)"
              value={days}
              onChange={(e) => {
                const value = e.target.value;
                // 숫자만 입력 가능하도록 검증
                if (value === '' || /^\d+$/.test(value)) {
                  setDays(value);
                  // 실시간 검증
                  const daysError = validateDays(value);
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    if (daysError) {
                      newErrors.days = daysError;
                    } else {
                      delete newErrors.days;
                    }
                    return newErrors;
                  });
                }
              }}
              className={`form-input ${errors.days ? 'input-error' : ''}`}
            />
            <div className="form-hint">1일부터 365일까지 입력 가능합니다</div>
          </div>

          {/* 연장 사유 */}
          <div className="form-section">
            <label className="form-label">연장 사유 <span className="required">*</span></label>
            {errors.reason && (
              <div className="error-message">{errors.reason}</div>
            )}
            <input
              type="text"
              maxLength={100}
              placeholder="예: 휴관일 보상, 공사로 인한 보상 등"
              value={reason}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 100) {
                  setReason(value);
                  // 실시간 검증
                  const reasonError = validateReason(value);
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    if (reasonError) {
                      newErrors.reason = reasonError;
                    } else {
                      delete newErrors.reason;
                    }
                    return newErrors;
                  });
                }
              }}
              className={`form-input ${errors.reason ? 'input-error' : ''}`}
            />
            <div className="form-hint">{reason.length}/100 글자</div>
          </div>

          {/* 경고 메시지 */}
          <div className="warning-box">
            주의: 이 작업은 되돌릴 수 없습니다. 신중하게 선택해주세요.
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            취소
          </button>
          <button
            className="btn btn-primary"
            onClick={handleExecute}
            disabled={loading}
          >
            {loading ? '처리 중...' : '연장 실행'}
          </button>
        </div>

        <style>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .modal-content {
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 24px;
            background: ${Gradients.primary};
            color: white;
          }

          .modal-title {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .close-button {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            transition: background-color 0.2s;
          }

          .close-button:hover {
            background-color: rgba(255, 255, 255, 0.1);
          }

          .modal-body {
            flex: 1;
            overflow-y: auto;
            padding: 24px;
          }

          .form-section {
            margin-bottom: 20px;
          }

          .form-label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #374151;
            font-size: 14px;
          }

          .radio-group {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .radio-option {
            display: flex;
            align-items: center;
            cursor: pointer;
          }

          .radio-option input[type="radio"] {
            margin-right: 12px;
            width: 18px;
            height: 18px;
            cursor: pointer;
          }

          .radio-label {
            display: flex;
            align-items: center;
            font-size: 14px;
            color: #374151;
          }

          .radio-icon {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .info-box {
            background-color: #e0f2fe;
            border: 1px solid #bae6fd;
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 20px;
            font-size: 14px;
            color: #0369a1;
          }

          .form-input {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.2s;
          }

          .form-input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          }

          .form-input.input-error {
            border-color: #dc2626;
          }

          .form-input.input-error:focus {
            border-color: #dc2626;
            box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
          }

          .required {
            color: #dc2626;
            margin-left: 4px;
          }

          .error-message {
            color: #dc2626;
            font-size: 12px;
            margin-top: 4px;
            margin-bottom: 8px;
          }

          .form-hint {
            margin-top: 6px;
            font-size: 12px;
            color: #6b7280;
          }

          .warning-box {
            background-color: #fef3c7;
            border: 1px solid #fde68a;
            border-radius: 8px;
            padding: 12px 16px;
            margin-top: 20px;
            font-size: 14px;
            color: #92400e;
          }

          .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            padding: 20px 24px;
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
          }

          .btn {
            padding: 10px 20px;
            border-radius: 6px;
            border: 1px solid;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 14px;
          }

          .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .btn-primary {
            background: ${Gradients.primary};
            border-color: #667eea;
            color: white;
          }

          .btn-primary:hover:not(:disabled) {
            background: ${Gradients.primaryHover};
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          }

          .btn-secondary {
            background-color: #f8fafc;
            border-color: #e2e8f0;
            color: #64748b;
          }

          .btn-secondary:hover:not(:disabled) {
            background-color: #f1f5f9;
            border-color: #cbd5e1;
          }
        `}</style>
      </div>
    </div>
  );
};

export default ExtendAllModal;


