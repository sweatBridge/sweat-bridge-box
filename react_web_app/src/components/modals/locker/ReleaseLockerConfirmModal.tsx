import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { Gradients } from '../../../constants/gradients';
import { AppColors } from '../../../constants/colors';
import { useCoachOptions } from '../../../hooks/useCoachOptions';

interface ReleaseLockerConfirmModalProps {
  visible: boolean;
  lockerNo: number;
  releasing: boolean;
  onClose: () => void;
  onConfirm: (note: string, assignee: string) => void;
  createToast?: (toast: { type: 'success' | 'danger' | 'warning' | 'info'; message: string }) => void;
}

const ReleaseLockerConfirmModal = ({
  visible,
  lockerNo,
  releasing,
  onClose,
  onConfirm,
  createToast
}: ReleaseLockerConfirmModalProps) => {
  const [note, setNote] = useState('');
  const [assignee, setAssignee] = useState('');
  const coachOptions = useCoachOptions(visible);

  const handleConfirm = () => {
    // 검증: 두 필드 모두 필수
    if (!note.trim()) {
      if (createToast) {
        createToast({
          type: 'warning',
          message: '해지 사유를 입력해주세요.'
        });
      }
      return;
    }
    if (!assignee.trim()) {
      if (createToast) {
        createToast({
          type: 'warning',
          message: '담당자를 입력해주세요.'
        });
      }
      return;
    }
    onConfirm(note, assignee);
  };

  const handleClose = () => {
    setNote('');
    setAssignee('');
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={() => !releasing && handleClose()}>
      <div className="modal-content release-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <Info size={20} className="header-icon" />
            <h3>회원 해지 확인</h3>
          </div>
          <button className="close-button" onClick={() => !releasing && handleClose()}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="release-message">
            <p className="release-title">회원의 락커를 해지하시겠습니까?</p>
          </div>

          <div className="form-section">
            <div className="form-group">
              <label>해지 사유</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="해지 사유를 입력하세요"
                className="form-input"
                disabled={releasing}
              />
            </div>
            <div className="form-group">
              <label>담당자</label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="form-input"
                disabled={releasing}
              >
                <option value="" disabled>
                  {coachOptions.length > 0 ? '담당자 선택' : '등록된 코치 없음'}
                </option>
                {coachOptions.map((coachName) => (
                  <option key={coachName} value={coachName}>
                    {coachName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleClose} disabled={releasing}>취소</button>
          <button className="btn btn-primary" onClick={handleConfirm} disabled={releasing}>
            {releasing ? '해지 중…' : '해지'}
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

        .release-message {
          text-align: center;
          padding: 12px 0;
        }

        .release-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin: 0;
          margin-bottom: 20px;
        }

        .form-section {
          margin-top: 20px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
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
          transition: all 0.2s ease;
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

export default ReleaseLockerConfirmModal;
