import { useState, useEffect } from 'react';
import { Edit, Calendar, User, FileText, CreditCard } from 'lucide-react';
import { Gradients } from '../../../constants/gradients';
import { AppColors } from '../../../constants/colors';
import DateInput from '../../DateInput';

interface EditMembershipModalProps {
  visible: boolean;
  membershipPlan: string;
  membershipType: string;
  currentStartDate: Date;
  currentEndDate: Date;
  membershipPrice: string;
  currentQuotaRemaining?: number;
  currentQuotaUsed?: number;
  onClose: () => void;
  onConfirm: (
    newStartDate: Date,
    newEndDate: Date,
    newQuotaRemaining: number,
    newQuotaUsed: number,
    reason: string,
    assignee: string
  ) => void;
  loading?: boolean;
}

const EditMembershipModal = ({
  visible,
  membershipPlan,
  membershipType,
  currentStartDate,
  currentEndDate,
  membershipPrice,
  currentQuotaRemaining = 0,
  currentQuotaUsed = 0,
  onClose,
  onConfirm,
  loading = false
}: EditMembershipModalProps) => {
  const [newStartDate, setNewStartDate] = useState<Date | null>(currentStartDate);
  const [newEndDate, setNewEndDate] = useState<Date | null>(currentEndDate);
  const [newQuotaRemaining, setNewQuotaRemaining] = useState<number>(currentQuotaRemaining);
  const [newQuotaUsed, setNewQuotaUsed] = useState<number>(currentQuotaUsed);
  const [reason, setReason] = useState('');
  const [assignee, setAssignee] = useState('');

  // visible이 변경될 때마다 날짜 초기화
  useEffect(() => {
    if (visible) {
      setNewStartDate(currentStartDate);
      setNewEndDate(currentEndDate);
      setNewQuotaRemaining(currentQuotaRemaining);
      setNewQuotaUsed(currentQuotaUsed);
      setReason('');
      setAssignee('');
    }
  }, [visible, currentStartDate, currentEndDate, currentQuotaRemaining, currentQuotaUsed]);

  if (!visible) return null;

  const handleConfirm = () => {
    if (!newStartDate || !newEndDate) {
      alert('시작일과 종료일을 입력해주세요.');
      return;
    }

    if (newStartDate >= newEndDate) {
      alert('종료일은 시작일보다 나중이어야 합니다.');
      return;
    }

    if (membershipType === 'countPass') {
      if (newQuotaRemaining < 0 || newQuotaUsed < 0) {
        alert('잔여 횟수와 사용 횟수는 0 이상이어야 합니다.');
        return;
      }
    }

    // 시작일/종료일이 변경된 경우에만 reason과 assignee 필수
    const dateChanged = 
      newStartDate.getTime() !== currentStartDate.getTime() ||
      newEndDate.getTime() !== currentEndDate.getTime();

    if (dateChanged) {
      if (!reason.trim() || reason.trim().length < 2) {
        alert('변경 사유는 최소 2자 이상 입력해주세요.');
        return;
      }

      if (!assignee.trim()) {
        alert('담당자를 입력해주세요.');
        return;
      }

      if (assignee.trim().length > 10) {
        alert('담당자는 10글자 이하로 입력해주세요.');
        return;
      }
    }

    onConfirm(newStartDate, newEndDate, newQuotaRemaining, newQuotaUsed, reason, assignee);
  };

  const handleClose = () => {
    if (!loading) {
      setNewStartDate(currentStartDate);
      setNewEndDate(currentEndDate);
      setNewQuotaRemaining(currentQuotaRemaining);
      setNewQuotaUsed(currentQuotaUsed);
      setReason('');
      setAssignee('');
      onClose();
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <Edit size={20} className="header-icon" />
            <h3>회원권 수정</h3>
          </div>
          <button className="close-button" onClick={handleClose} disabled={loading}>×</button>
        </div>
        
        <div className="modal-body">
          {/* 회원권 정보 헤더 */}
          <div className="membership-header">
            <div className="membership-title">
              <CreditCard size={16} />
              <span>{membershipPlan}</span>
              <span className="type-badge">
                {membershipType === 'countPass' ? '횟수권' : '기간권'}
              </span>
            </div>
            <div className="current-period">
              <Calendar size={14} />
              <span>{formatDate(currentStartDate)} ~ {formatDate(currentEndDate)}</span>
            </div>
          </div>

          {/* 수정 폼 */}
          <div className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label>
                  <Calendar size={16} />
                  새 시작일
                </label>
                <DateInput
                  selected={newStartDate}
                  onChange={(date) => setNewStartDate(date)}
                  disabled={loading}
                  placeholder="시작일 선택"
                />
              </div>

              <div className="form-group">
                <label>
                  <Calendar size={16} />
                  새 종료일
                </label>
                <DateInput
                  selected={newEndDate}
                  onChange={(date) => setNewEndDate(date)}
                  disabled={loading}
                  placeholder="종료일 선택"
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                <User size={16} />
                담당자
              </label>
              <input
                type="text"
                className="form-input"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="담당자 이름 (최대 10자)"
                maxLength={10}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>
                <CreditCard size={16} />
                가격
              </label>
              <input
                type="text"
                className="form-input"
                value={membershipPrice + '원'}
                disabled={true}
                readOnly
              />
            </div>

            {membershipType === 'countPass' && (
              <div className="form-row">
                <div className="form-group">
                  <label>
                    <FileText size={16} />
                    잔여 횟수
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={newQuotaRemaining}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setNewQuotaRemaining(value);
                    }}
                    min="0"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>
                    <FileText size={16} />
                    사용 횟수
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={newQuotaUsed}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setNewQuotaUsed(value);
                    }}
                    min="0"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>
                <FileText size={16} />
                변경 사유
              </label>
              <input
                type="text"
                className="form-input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="변경 사유를 입력하세요 (최소 2자 이상)"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleClose} disabled={loading}>
            취소
          </button>
          <button className="btn btn-primary" onClick={handleConfirm} disabled={loading}>
            {loading ? '처리 중...' : '수정'}
          </button>
        </div>
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
          justify-content: center;
          align-items: center;
          z-index: 1050;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          overflow-y: auto;
          max-height: 90vh;
        }

        .edit-modal {
          max-width: 550px;
          width: 95%;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: ${Gradients.primary};
          border-bottom: none;
          border-radius: 8px 8px 0 0;
          box-shadow: 0 2px 10px rgba(102, 126, 234, 0.15);
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .header-icon {
          color: white;
          opacity: 0.9;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: white;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: white;
          opacity: 0.8;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .close-button:hover:not(:disabled) {
          background-color: rgba(255, 255, 255, 0.2);
          opacity: 1;
          transform: scale(1.1);
        }

        .close-button:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .modal-body {
          padding: 20px;
        }

        .membership-header {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 14px;
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .membership-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
          font-weight: 600;
          color: #1e293b;
        }

        .membership-title svg {
          color: #64748b;
        }

        .type-badge {
          background-color: #dbeafe;
          color: #1e40af;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .current-period {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #64748b;
          padding-left: 24px;
        }

        .current-period svg {
          flex-shrink: 0;
        }

        .form-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          color: #374151;
          font-size: 14px;
        }

        .form-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: all 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: ${AppColors.primary};
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .form-input:disabled {
          background-color: #f3f4f6;
          color: #6b7280;
          cursor: not-allowed;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px;
          border-top: 1px solid #e5e7eb;
          background-color: #f9fafb;
        }

        .btn {
          padding: 10px 20px;
          border-radius: 6px;
          border: 1px solid;
          cursor: pointer;
          font-weight: 600;
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
          background-color: ${AppColors.primary};
          border-color: ${AppColors.primary};
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: ${AppColors.primaryHover};
          border-color: ${AppColors.primaryHover};
        }

        .btn-secondary {
          background-color: #ffffff;
          border-color: #d1d5db;
          color: #374151;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #f9fafb;
          border-color: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default EditMembershipModal;

