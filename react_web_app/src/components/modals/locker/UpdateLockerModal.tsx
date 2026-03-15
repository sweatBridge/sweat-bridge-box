import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { Gradients } from '../../../constants/gradients';
import { AppColors } from '../../../constants/colors';
import { LOCKER_STATE, LockerUpdatableState } from '../../../types/locker';

const { UNUSED, NA } = LOCKER_STATE;

interface UpdateLockerModalProps {
  visible: boolean;
  lockerNo: number;
  currentState: LockerUpdatableState;
  updating: boolean;
  onClose: () => void;
  onConfirm: (state: LockerUpdatableState, note: string, assignee: string) => void;
  createToast?: (toast: { type: 'success' | 'danger' | 'warning' | 'info'; message: string }) => void;
}

const UpdateLockerModal = ({
  visible,
  lockerNo,
  currentState,
  updating,
  onClose,
  onConfirm,
  createToast
}: UpdateLockerModalProps) => {
  const [updateState, setUpdateState] = useState<LockerUpdatableState>(
    currentState === NA ? NA : UNUSED
  );
  const [updateNote, setUpdateNote] = useState('');
  const [updateAssignee, setUpdateAssignee] = useState('');

  if (!visible) return null;

  const handleConfirm = () => {
    // 검증: 사유와 담당자 필드 모두 필수
    if (!updateNote.trim()) {
      if (createToast) {
        createToast({
          type: 'warning',
          message: '사유를 입력해주세요.'
        });
      }
      return;
    }
    if (!updateAssignee.trim()) {
      if (createToast) {
        createToast({
          type: 'warning',
          message: '담당자를 입력해주세요.'
        });
      }
      return;
    }
    onConfirm(updateState, updateNote, updateAssignee);
  };

  return (
    <div className="modal-overlay" onClick={() => !updating && onClose()}>
      <div className="modal-content update-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <Info size={20} className="header-icon" />
            <h3>락커 #{lockerNo} 상태 변경</h3>
          </div>
          <button className="close-button" onClick={() => !updating && onClose()}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="form-section">
            <div className="form-group">
              <label>상태</label>
              <select
                className="form-input"
                value={updateState}
                onChange={(e) => setUpdateState(e.target.value as LockerUpdatableState)}
                disabled={updating}
                style={{ backgroundColor: 'white', background: 'white' }}
              >
                <option value={UNUSED} disabled={currentState === UNUSED}>사용 가능</option>
                <option value={NA} disabled={currentState === NA}>고장</option>
              </select>
            </div>

            <div className="form-group">
              <label>사유</label>
              <textarea
                className="form-input form-textarea"
                value={updateNote}
                onChange={(e) => setUpdateNote(e.target.value)}
                placeholder="사유를 입력하세요"
                disabled={updating}
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>담당자</label>
              <input
                type="text"
                className="form-input"
                value={updateAssignee}
                onChange={(e) => setUpdateAssignee(e.target.value)}
                placeholder="담당자를 입력하세요"
                disabled={updating}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={updating}>취소</button>
          <button className="btn btn-primary" onClick={handleConfirm} disabled={updating}>
            {updating ? '수정 중…' : '저장'}
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

        .form-section {
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 20px;
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

        /* select를 제외한 입력 필드에만 회색 배경 적용 */
        input.form-input:not([type="checkbox"]):not([type="radio"]),
        textarea.form-input {
          background-color: #fafbfc;
        }

        .form-input:focus {
          outline: none;
          border-color: ${AppColors.primary};
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
          background-color: white;
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
        }

        .form-input:disabled {
          background-color: #f3f4f6;
          color: #6b7280;
          cursor: not-allowed;
        }

        .form-input option:disabled {
          color: #9ca3af;
          background-color: #f3f4f6;
        }

        .update-modal select.form-input {
          cursor: pointer;
          background-color: white !important;
          background: white !important;
        }

        .update-modal select.form-input:not(:disabled) {
          background-color: white !important;
          background: white !important;
        }

        .update-modal select.form-input:focus {
          background-color: white !important;
          background: white !important;
        }

        .update-modal select.form-input:hover {
          background-color: white !important;
          background: white !important;
        }

        .update-modal select.form-input:disabled {
          cursor: not-allowed;
          background-color: #f3f4f6 !important;
          background: #f3f4f6 !important;
        }

        .update-modal select.form-input option {
          background-color: white !important;
          background: white !important;
        }

        .update-modal select.form-input option:disabled {
          color: #9ca3af !important;
          background-color: #f3f4f6 !important;
          background: #f3f4f6 !important;
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

export default UpdateLockerModal;

