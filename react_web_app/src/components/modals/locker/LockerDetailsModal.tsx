import React from 'react';
import { Info } from 'lucide-react';
import { Gradients } from '../../../constants/gradients';
import { AppColors } from '../../../constants/colors';
import type { LockerState } from '../../../types/locker';
import { LOCKER_STATE } from '../../../types/locker';

interface LockerDetailsModalProps {
  visible: boolean;
  lockerNo: number;
  name: string;
  phone: string;
  startDate: string;
  endDate: string;
  onClose: () => void;
  onUpdate: () => void;
  onAssign: () => void;
  onRelease: () => void;
  onDelete: () => void;
  onHistory: () => void;
  state: LockerState;
  releasing: boolean;
  deleting: boolean;
}

const LockerDetailsModal = ({
  visible,
  lockerNo,
  name,
  phone,
  startDate,
  endDate,
  onClose,
  onUpdate,
  onAssign,
  onRelease,
  onDelete,
  onHistory,
  state,
  releasing,
  deleting
}: LockerDetailsModalProps) => {
  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <Info size={20} className="header-icon" />
            <h3>락커 #{lockerNo} 정보</h3>
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {/* 액션 버튼 */}
          <div className="action-buttons">
            <button className="btn btn-action" onClick={onUpdate}>상태 변경</button>
            {!name.trim() ? (
              <button 
                className="btn btn-action" 
                onClick={onAssign}
                disabled={state === LOCKER_STATE.NA}
              >
                락커 배정
              </button>
            ) : (
              <button 
                className="btn btn-action" 
                onClick={onRelease}
                disabled={releasing}
              >
                {releasing ? '해지 중...' : '회원 해지'}
              </button>
            )}
            <button 
              className="btn btn-action" 
              onClick={onDelete}
              disabled={deleting || name.trim().length > 0}
            >
              {deleting ? '삭제 중...' : '락커 삭제'}
            </button>
          </div>

          <div className="form-section">
            <div className="form-group name-input-group">
              <label>회원 이름</label>
              <input
                type="text"
                value={name}
                readOnly
                placeholder="—"
                className="form-input name-input"
              />
              <button className="btn btn-primary history-btn" onClick={onHistory}>히스토리</button>
            </div>
            <div className="form-group">
              <label>회원 전화 번호</label>
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                readOnly
                placeholder="—"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>사용 시작</label>
              <input
                type="date"
                value={startDate}
                readOnly
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>사용 종료</label>
              <input
                type="date"
                value={endDate}
                readOnly
                className="form-input"
              />
            </div>
          </div>
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
          max-width: 750px;
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

        .action-buttons {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
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

        .btn-action {
          background: #ffffff;
          color: #374151;
          border-color: #d1d5db;
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 600;
          flex: 1;
        }

        .btn-action:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .btn-action:disabled {
          background: #e5e7eb;
          color: #9ca3af;
          border: 1px solid #d1d5db;
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

        .form-section {
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .name-input-group {
          position: relative;
        }

        .name-input {
          padding-right: 90px;
        }

        .history-btn {
          position: absolute;
          right: 2px;
          top: 29px;
          height: 40px;
          margin: 0;
          padding: 9px 12px;
        }

        .form-group label {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          font-weight: 500;
          color: #374151;
          font-size: 14px;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s ease;
          background-color: #fafbfc;
        }

        .form-input:focus {
          outline: none;
          border-color: ${AppColors.primary};
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
          background-color: white;
        }

        .form-input:read-only {
          background-color: #f3f4f6;
          color: #6b7280;
          cursor: not-allowed;
          border-color: #e5e7eb;
        }

        .form-input:read-only:focus {
          border-color: #e5e7eb;
          box-shadow: none;
          background-color: #f3f4f6;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px;
          border-top: 1px solid #e5e7eb;
          background-color: #f9fafb;
        }
      `}</style>
    </div>
  );
};

export default LockerDetailsModal;

