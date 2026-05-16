import React from 'react';
import { Info } from 'lucide-react';
import { Gradients } from '../../../constants/gradients';

interface DeleteLockerConfirmModalProps {
  visible: boolean;
  lockerNo: number;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteLockerConfirmModal = ({
  visible,
  lockerNo,
  deleting,
  onClose,
  onConfirm
}: DeleteLockerConfirmModalProps) => {
  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={() => !deleting && onClose()}>
      <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <Info size={20} className="header-icon" />
            <h3>락커 삭제 확인</h3>
          </div>
          <button className="close-button" onClick={() => !deleting && onClose()}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="delete-message">
            <p className="delete-title">락커 #{lockerNo}를 삭제하시겠습니까?</p>
            <div className="delete-info-box">
              <Info size={16} />
              <span>락커 삭제 시에도 회원 히스토리/결제 기록은 유지됩니다.</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={deleting}>취소</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={deleting}>
            {deleting ? '삭제 중…' : '삭제'}
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
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
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

        .close-button:hover {
          background-color: rgba(255, 255, 255, 0.2);
          opacity: 1;
          transform: scale(1.1);
        }

        .modal-body {
          padding: 20px;
        }

        .delete-message {
          text-align: center;
          padding: 12px 0;
        }

        .delete-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 20px;
        }

        .delete-info-box {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 18px;
          background-color: #fef3c7;
          border: 1px solid #fde68a;
          border-radius: 8px;
          color: #92400e;
          font-size: 14px;
          line-height: 1.5;
          text-align: left;
        }

        .delete-info-box svg {
          flex-shrink: 0;
          color: #f59e0b;
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
          background-color: #dc2626;
          border-color: #dc2626;
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background-color: #b91c1c;
          border-color: #b91c1c;
        }

        .btn-danger:disabled {
          background-color: #fca5a5;
          border-color: #fca5a5;
        }
      `}</style>
    </div>
  );
};

export default DeleteLockerConfirmModal;

