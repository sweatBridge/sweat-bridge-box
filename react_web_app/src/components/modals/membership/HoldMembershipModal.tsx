import { useState } from 'react';
import { Pause, Calendar, User, FileText } from 'lucide-react';
import { Gradients } from '../../../constants/gradients';
import { AppColors } from '../../../constants/colors';
import { formatDateToString, parseStringToDate } from '../../../utils/dateUtils';

interface HoldMembershipModalProps {
  visible: boolean;
  membershipStartDate: Date;
  membershipEndDate: Date;
  onClose: () => void;
  onConfirm: (holdStartDate: Date, holdEndDate: Date, reason: string, assignee: string) => void;
  loading?: boolean;
}

const HoldMembershipModal = ({
  visible,
  membershipStartDate,
  membershipEndDate,
  onClose,
  onConfirm,
  loading = false
}: HoldMembershipModalProps) => {
  const [holdStartDate, setHoldStartDate] = useState<Date | null>(null);
  const [holdEndDate, setHoldEndDate] = useState<Date | null>(null);
  const [reason, setReason] = useState('');
  const [assignee, setAssignee] = useState('');

  if (!visible) return null;

  const handleConfirm = () => {
    if (!holdStartDate || !holdEndDate) {
      alert('홀딩 시작일과 종료일을 입력해주세요.');
      return;
    }

    if (holdStartDate >= holdEndDate) {
      alert('종료일은 시작일보다 나중이어야 합니다.');
      return;
    }

    // 홀딩 시작일이 회원권 시작일보다 뒤어야 함
    const membershipStart = new Date(membershipStartDate);
    membershipStart.setHours(0, 0, 0, 0);
    const holdStart = new Date(holdStartDate);
    holdStart.setHours(0, 0, 0, 0);
    
    if (holdStart <= membershipStart) {
      alert('홀딩 시작일은 회원권 시작일보다 뒤여야 합니다.');
      return;
    }

    // 홀딩 종료일은 (홀딩일 수를 회원권 종료일에 더한 일)보다 앞이어야 함
    const membershipEnd = new Date(membershipEndDate);
    membershipEnd.setHours(0, 0, 0, 0);
    const holdEnd = new Date(holdEndDate);
    holdEnd.setHours(0, 0, 0, 0);
    
    // 홀딩일 수 계산
    const holdDays = Math.ceil((holdEnd.getTime() - holdStart.getTime()) / (1000 * 60 * 60 * 24));
    
    // 회원권 종료일에 홀딩일 수를 더한 날짜
    const extendedEndDate = new Date(membershipEnd);
    extendedEndDate.setDate(extendedEndDate.getDate() + holdDays);
    
    if (holdEnd >= extendedEndDate) {
      alert(`홀딩 종료일은 회원권 종료일(${formatDateToString(membershipEnd)})에 홀딩일 수(${holdDays}일)를 더한 날짜보다 앞이어야 합니다.`);
      return;
    }

    if (!reason.trim()) {
      alert('홀딩 사유를 입력해주세요.');
      return;
    }

    if (!assignee.trim()) {
      alert('담당자를 입력해주세요.');
      return;
    }

    onConfirm(holdStartDate, holdEndDate, reason, assignee);
  };

  const handleClose = () => {
    if (!loading) {
      setHoldStartDate(null);
      setHoldEndDate(null);
      setReason('');
      setAssignee('');
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content hold-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <Pause size={20} className="header-icon" />
            <h3>회원권 홀딩</h3>
          </div>
          <button className="close-button" onClick={handleClose} disabled={loading}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="info-message">
            <Pause size={16} />
            <p>홀딩 기간 동안 회원권 만료일이 자동으로 연장됩니다.</p>
          </div>

          <div className="form-section">
            <div className="form-group">
              <label>
                <Calendar size={16} />
                홀딩 시작일
              </label>
              <input
                type="date"
                className="form-input"
                value={formatDateToString(holdStartDate)}
                onChange={(e) => setHoldStartDate(parseStringToDate(e.target.value))}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>
                <Calendar size={16} />
                홀딩 종료일
              </label>
              <input
                type="date"
                className="form-input"
                value={formatDateToString(holdEndDate)}
                onChange={(e) => setHoldEndDate(parseStringToDate(e.target.value))}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>
                <FileText size={16} />
                홀딩 사유
              </label>
              <textarea
                className="form-input form-textarea"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="홀딩 사유를 입력하세요"
                disabled={loading}
                rows={3}
              />
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
                placeholder="담당자 이름"
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
            {loading ? '처리 중...' : '적용'}
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
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          overflow-y: auto;
        }

        .hold-modal {
          max-width: 500px;
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

        .info-message {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background-color: #e0f2fe;
          border: 1px solid #bae6fd;
          border-radius: 8px;
          color: #0c4a6e;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .info-message svg {
          flex-shrink: 0;
        }

        .form-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
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

        .form-textarea {
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
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
          padding: 8px 16px;
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
          background-color: ${AppColors.primary};
          border-color: ${AppColors.primary};
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #1d4ed8;
          border-color: #1d4ed8;
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

export default HoldMembershipModal;

