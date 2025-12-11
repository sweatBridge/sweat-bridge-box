import { useState } from 'react';
import { DollarSign, Calendar, User } from 'lucide-react';

interface RefundMembershipModalProps {
  visible: boolean;
  membershipPlan: string;
  membershipPrice: string;
  onClose: () => void;
  onConfirm: (refundAmount: string, reason: string, assignee: string) => void;
  loading?: boolean;
}

const RefundMembershipModal = ({
  visible,
  membershipPlan,
  membershipPrice,
  onClose,
  onConfirm,
  loading = false
}: RefundMembershipModalProps) => {
  const [refundAmount, setRefundAmount] = useState(membershipPrice);
  const [reason, setReason] = useState('');
  const [assignee, setAssignee] = useState('');

  if (!visible) return null;

  const handleConfirm = () => {
    if (!refundAmount || parseInt(refundAmount) <= 0) {
      alert('환불 금액을 입력해주세요.');
      return;
    }

    if (!reason.trim()) {
      alert('환불 사유를 입력해주세요.');
      return;
    }

    if (!assignee.trim()) {
      alert('담당자를 입력해주세요.');
      return;
    }

    onConfirm(refundAmount, reason, assignee);
  };

  const handleClose = () => {
    if (!loading) {
      setRefundAmount(membershipPrice);
      setReason('');
      setAssignee('');
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content refund-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <DollarSign size={20} className="header-icon" />
            <h3>회원권 환불</h3>
          </div>
          <button className="close-button" onClick={handleClose} disabled={loading}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="info-message">
            <DollarSign size={16} />
            <p>환불 처리 후 회원권이 자동으로 삭제됩니다.</p>
          </div>

          <div className="membership-info">
            <div className="info-row">
              <span className="info-label">플랜</span>
              <span className="info-value">{membershipPlan}</span>
            </div>
            <div className="info-row">
              <span className="info-label">결제 금액</span>
              <span className="info-value">{membershipPrice}원</span>
            </div>
          </div>

          <div className="form-section">
            <div className="form-group">
              <label>
                <DollarSign size={16} />
                환불 금액
              </label>
              <input
                type="text"
                className="form-input"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                disabled={loading}
                placeholder="환불 금액"
              />
            </div>

            <div className="form-group">
              <label>
                <Calendar size={16} />
                환불 사유
              </label>
              <textarea
                className="form-input form-textarea"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="환불 사유를 입력하세요"
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
                disabled={loading}
                placeholder="담당자 이름"
                maxLength={10}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleClose} disabled={loading}>
            취소
          </button>
          <button className="btn btn-primary" onClick={handleConfirm} disabled={loading}>
            {loading ? '처리 중...' : '환불'}
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
        }

        .refund-modal {
          max-width: 500px;
          width: 95%;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          border-bottom: none;
          border-radius: 8px 8px 0 0;
          box-shadow: 0 2px 10px rgba(37, 99, 235, 0.15);
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
          background-color: #dbeafe;
          border: 1px solid #93c5fd;
          border-radius: 8px;
          color: #1e40af;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .info-message svg {
          flex-shrink: 0;
        }

        .membership-info {
          background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .info-label {
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
        }

        .info-value {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
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
          border-color: #2563eb;
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

        .btn-secondary {
          background-color: #ffffff;
          border-color: #d1d5db;
          color: #374151;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #f9fafb;
          border-color: #9ca3af;
        }

        .btn-primary {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          border-color: #2563eb;
          color: white;
          box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
        }

        .btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
          border-color: #1d4ed8;
          box-shadow: 0 4px 8px rgba(37, 99, 235, 0.3);
          transform: translateY(-1px);
        }

        .btn-primary:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 1px 2px rgba(37, 99, 235, 0.2);
        }
      `}</style>
    </div>
  );
};

export default RefundMembershipModal;

