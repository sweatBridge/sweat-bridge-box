import { AlertTriangle } from 'lucide-react';

interface DeleteMembershipConfirmModalProps {
  visible: boolean;
  membershipPlan: string;
  membershipPrice: string;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

const DeleteMembershipConfirmModal = ({
  visible,
  membershipPlan,
  membershipPrice,
  onClose,
  onConfirm,
  loading = false
}: DeleteMembershipConfirmModalProps) => {
  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <AlertTriangle size={20} className="header-icon" />
            <h3>회원권 삭제 확인</h3>
          </div>
          <button className="close-button" onClick={onClose} disabled={loading}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="warning-icon">
            <AlertTriangle size={48} />
          </div>
          
          <div className="warning-message">
            <p className="main-message">
              결제 내역은 전액 환불 후 회원권이 삭제됩니다.
            </p>
            <p className="sub-message">
              정말 삭제하시겠습니까?
            </p>
          </div>

          <div className="membership-info">
            <div className="info-row">
              <span className="info-label">플랜</span>
              <span className="info-value">{membershipPlan}</span>
            </div>
            <div className="info-row">
              <span className="info-label">금액</span>
              <span className="info-value price">{membershipPrice}원</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            취소
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? '삭제 중...' : '삭제'}
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

        .delete-confirm-modal {
          max-width: 450px;
          width: 95%;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          border-bottom: none;
          border-radius: 8px 8px 0 0;
          box-shadow: 0 2px 10px rgba(220, 38, 38, 0.15);
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
          padding: 30px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .warning-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          animation: pulse 2s infinite;
        }

        .warning-icon svg {
          color: #dc2626;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 0 10px rgba(220, 38, 38, 0);
          }
        }

        .warning-message {
          margin-bottom: 24px;
        }

        .main-message {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 12px 0;
          line-height: 1.5;
        }

        .sub-message {
          font-size: 15px;
          color: #dc2626;
          font-weight: 600;
          margin: 0;
        }

        .membership-info {
          width: 100%;
          background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
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

        .info-value.price {
          color: #dc2626;
          font-size: 16px;
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

        .btn-danger {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          border-color: #dc2626;
          color: white;
          box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
        }

        .btn-danger:hover:not(:disabled) {
          background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
          border-color: #b91c1c;
          box-shadow: 0 4px 8px rgba(220, 38, 38, 0.3);
          transform: translateY(-1px);
        }

        .btn-danger:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 1px 2px rgba(220, 38, 38, 0.2);
        }
      `}</style>
    </div>
  );
};

export default DeleteMembershipConfirmModal;

