import { AlertTriangle, UserPlus, Trash2 } from 'lucide-react';
import { formatPhoneNumber } from '../../../utils/phoneUtils';

interface CoachActionConfirmModalProps {
  visible: boolean;
  mode: 'add' | 'delete';
  coachName: string;
  coachPhone: string;
  coachEmail: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const CoachActionConfirmModal = ({
  visible,
  mode,
  coachName,
  coachPhone,
  coachEmail,
  loading = false,
  onClose,
  onConfirm
}: CoachActionConfirmModalProps) => {
  if (!visible) return null;

  const isDelete = mode === 'delete';
  const title = isDelete ? '코치 삭제 확인' : '코치 추가 확인';
  const message = isDelete
    ? `${coachName} 코치를 삭제하시겠습니까?`
    : `${coachName} 코치 추가하시겠습니까?`;
  const confirmLabel = isDelete ? (loading ? '삭제 중...' : '삭제') : (loading ? '추가 중...' : '확인');

  return (
    <div className="modal-overlay" onClick={() => !loading && onClose()}>
      <div className="modal-content coach-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className={`modal-header ${isDelete ? 'danger' : 'primary'}`}>
          <div className="header-title">
            {isDelete ? <Trash2 size={20} className="header-icon" /> : <UserPlus size={20} className="header-icon" />}
            <h3>{title}</h3>
          </div>
          <button className="close-button" onClick={() => !loading && onClose()} disabled={loading}>×</button>
        </div>

        <div className="modal-body">
          <div className={`message-icon ${isDelete ? 'danger' : 'primary'}`}>
            <AlertTriangle size={42} />
          </div>

          <p className="main-message">{message}</p>

          <div className="coach-info">
            <div className="info-row">
              <span className="info-label">이름</span>
              <span className="info-value">{coachName}</span>
            </div>
            <div className="info-row">
              <span className="info-label">연락처</span>
              <span className="info-value">{formatPhoneNumber(coachPhone)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">이메일</span>
              <span className="info-value">{coachEmail}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            취소
          </button>
          <button className={`btn ${isDelete ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={loading}>
            {confirmLabel}
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
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
          width: 95%;
          max-width: 460px;
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 20px;
          color: white;
        }

        .modal-header.primary {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        }

        .modal-header.danger {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 700;
        }

        .close-button {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          opacity: 0.9;
        }

        .modal-body {
          padding: 28px 22px 20px;
          text-align: center;
        }

        .message-icon {
          width: 76px;
          height: 76px;
          margin: 0 auto 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .message-icon.primary {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .message-icon.danger {
          background: #fee2e2;
          color: #dc2626;
        }

        .main-message {
          margin: 0 0 20px;
          font-size: 17px;
          font-weight: 700;
          color: #111827;
        }

        .coach-info {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #f9fafb;
          padding: 14px 16px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding: 8px 0;
          text-align: left;
        }

        .info-label {
          color: #6b7280;
          font-size: 14px;
        }

        .info-value {
          color: #111827;
          font-size: 14px;
          font-weight: 600;
          word-break: break-all;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 18px 20px;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .btn {
          padding: 10px 18px;
          border-radius: 6px;
          border: 1px solid;
          cursor: pointer;
          font-weight: 600;
        }

        .btn-secondary {
          background: white;
          border-color: #d1d5db;
          color: #374151;
        }

        .btn-primary {
          background: #2563eb;
          border-color: #2563eb;
          color: white;
        }

        .btn-danger {
          background: #dc2626;
          border-color: #dc2626;
          color: white;
        }

        .btn:disabled,
        .close-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default CoachActionConfirmModal;
