import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Gradients } from '../../../constants/gradients';

interface AddLockerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (startNo: string, endNo: string) => Promise<void>;
}

const AddLockerModal = ({ visible, onClose, onConfirm }: AddLockerModalProps) => {
  const [startNo, setStartNo] = useState<string>('');
  const [endNo, setEndNo] = useState<string>('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  if (!visible) return null;

  const handleConfirm = async () => {
    setAddError(null);
    const startNumber = parseInt(startNo, 10);
    const endNumber = parseInt(endNo, 10);
    
    if (Number.isNaN(startNumber) || Number.isNaN(endNumber)) {
      setAddError('숫자를 정확히 입력해 주세요.');
      return;
    }
    if (startNumber < 1 || endNumber < 1) {
      setAddError('번호는 1 이상이어야 합니다.');
      return;
    }
    if (endNumber < startNumber) {
      setAddError('끝 번호는 시작 번호보다 크거나 같아야 합니다.');
      return;
    }

    setAdding(true);
    try {
      await onConfirm(startNo, endNo);
      setStartNo('');
      setEndNo('');
    } catch (err: any) {
      setAddError(err?.message ?? String(err));
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => !adding && onClose()}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <Plus size={20} className="header-icon" />
            <h3>락커 일괄 추가</h3>
          </div>
          <button className="close-button" onClick={() => !adding && onClose()}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label>시작 번호</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  value={startNo}
                  onChange={(e) => setStartNo(e.target.value)}
                  placeholder="예: 201"
                  disabled={adding}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>끝 번호</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  value={endNo}
                  onChange={(e) => setEndNo(e.target.value)}
                  placeholder="예: 220"
                  disabled={adding}
                  className="form-input"
                />
              </div>
            </div>
            
            <div className="info-box">
              예시: 201~220 입력 시 201, 202, ... 220까지 20개의 락커가 생성됩니다.
            </div>

            {addError && <div className="form-error">{addError}</div>}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={adding}>취소</button>
          <button className="btn btn-primary" onClick={handleConfirm} disabled={adding}>
            {adding ? '추가 중…' : '추가'}
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

        .form-section {
          margin-bottom: 20px;
        }

        .form-row {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .form-row .form-group {
          flex: 1;
          margin-bottom: 0;
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

        .info-box {
          padding: 12px 16px;
          background-color: #e0f2fe;
          border: 1px solid #bae6fd;
          border-radius: 8px;
          color: #0c4a6e;
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 16px;
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
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
          background-color: white;
        }

        .form-error { 
          color: #b91c1c; 
          font-size: 13px; 
          margin-top: 8px; 
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
          background-color: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #2563eb;
          border-color: #2563eb;
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

export default AddLockerModal;

