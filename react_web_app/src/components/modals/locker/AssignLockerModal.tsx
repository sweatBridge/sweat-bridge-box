import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Gradients } from '../../../constants/gradients';
import type { Member } from '../../../types/member';

interface AssignLockerModalProps {
  visible: boolean;
  lockerNo: number;
  assigning: boolean;
  searching: boolean;
  onClose: () => void;
  onConfirm: (member: Member, startDate: string, endDate: string, price: string, paymentType: 'cash' | 'card') => void;
  onSearch: (searchText: string) => Promise<Member[]>;
}

const AssignLockerModal = ({
  visible,
  lockerNo,
  assigning,
  searching,
  onClose,
  onConfirm,
  onSearch
}: AssignLockerModalProps) => {
  const [assignSearchText, setAssignSearchText] = useState('');
  const [assignSearchResults, setAssignSearchResults] = useState<Member[]>([]);
  const [assignSelectedMember, setAssignSelectedMember] = useState<Member | null>(null);
  const [assignStartDate, setAssignStartDate] = useState('');
  const [assignEndDate, setAssignEndDate] = useState('');
  const [assignPrice, setAssignPrice] = useState('');
  const [assignPaymentType, setAssignPaymentType] = useState<'cash' | 'card'>('cash');

  if (!visible) return null;

  const handleSearch = async () => {
    if (!assignSearchText.trim()) {
      setAssignSearchResults([]);
      return;
    }

    try {
      const results = await onSearch(assignSearchText);
      setAssignSearchResults(results);
    } catch (err: any) {
      console.error('Search error:', err);
    }
  };

  const handleSelectMember = (member: Member) => {
    setAssignSelectedMember(member);
    setAssignSearchResults([]);
  };

  const handleConfirm = () => {
    if (!assignSelectedMember) {
      alert('회원을 선택해주세요.');
      return;
    }

    if (!assignStartDate || !assignEndDate) {
      alert('시작 날짜와 종료 날짜를 입력해주세요.');
      return;
    }

    if (!assignPrice || assignPrice === '0') {
      alert('가격을 입력해주세요.');
      return;
    }

    onConfirm(assignSelectedMember, assignStartDate, assignEndDate, assignPrice, assignPaymentType);
  };

  return (
    <div className="modal-overlay" onClick={() => !assigning && onClose()}>
      <div className="modal-content assign-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <Plus size={20} className="header-icon" />
            <h3>락커 #{lockerNo} 배정</h3>
          </div>
          <button className="close-button" onClick={() => !assigning && onClose()}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="form-section">
            {/* 회원 검색 */}
            <div className="form-group">
              <label>이름 검색</label>
              <div className="search-input-wrapper">
                <input
                  type="text"
                  className="form-input"
                  value={assignSearchText}
                  onChange={(e) => setAssignSearchText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="회원 이름을 입력하세요"
                  disabled={assigning}
                />
                <button 
                  className="btn btn-primary search-btn" 
                  onClick={handleSearch}
                  disabled={searching || assigning}
                >
                  {searching ? '검색 중...' : '검색'}
                </button>
              </div>

              {/* 선택된 회원 표시 */}
              {assignSelectedMember && (
                <div className="selected-member">
                  <div className="member-info">
                    <strong>{assignSelectedMember.realName}</strong>
                    <span className="member-detail">{assignSelectedMember.phone}</span>
                  </div>
                  <button 
                    className="clear-btn" 
                    onClick={() => setAssignSelectedMember(null)}
                    disabled={assigning}
                  >
                    ×
                  </button>
                </div>
              )}

              {/* 검색 결과 */}
              {assignSearchResults.length > 0 && !assignSelectedMember && (
                <div className="search-results">
                  {assignSearchResults.map((member) => (
                    <div 
                      key={member.email} 
                      className="search-result-item"
                      onClick={() => handleSelectMember(member)}
                    >
                      <div className="member-name">{member.realName}</div>
                      <div className="member-phone">{member.phone || member.phone}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 시작 날짜 */}
            <div className="form-group">
              <label>시작 날짜</label>
              <input
                type="date"
                className="form-input"
                value={assignStartDate}
                onChange={(e) => setAssignStartDate(e.target.value)}
                disabled={assigning}
              />
            </div>

            {/* 종료 날짜 */}
            <div className="form-group">
              <label>종료 날짜</label>
              <input
                type="date"
                className="form-input"
                value={assignEndDate}
                onChange={(e) => setAssignEndDate(e.target.value)}
                disabled={assigning}
              />
            </div>

            {/* 가격 및 결제수단 */}
            <div className="form-row">
              <div className="form-group">
                <label>가격</label>
                <input
                  type="text"
                  className="form-input"
                  value={assignPrice}
                  onChange={(e) => setAssignPrice(e.target.value)}
                  placeholder="가격"
                  disabled={assigning}
                />
              </div>

              <div className="form-group">
                <label>결제수단</label>
                <select
                  value={assignPaymentType}
                  onChange={(e) => setAssignPaymentType(e.target.value as 'cash' | 'card')}
                  className="form-input"
                  disabled={assigning}
                >
                  <option value="cash">현금</option>
                  <option value="card">카드</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={assigning}>취소</button>
          <button className="btn btn-primary" onClick={handleConfirm} disabled={assigning}>
            {assigning ? '배정 중…' : '배정'}
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

        .search-input-wrapper {
          display: flex;
          gap: 8px;
        }

        .search-input-wrapper .form-input {
          flex: 1;
        }

        .search-btn {
          padding: 12px 20px;
          white-space: nowrap;
        }

        .selected-member {
          margin-top: 12px;
          padding: 12px;
          background-color: #e0f2fe;
          border: 1px solid #bae6fd;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .member-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .member-detail {
          font-size: 13px;
          color: #64748b;
        }

        .clear-btn {
          background: none;
          border: none;
          font-size: 24px;
          color: #64748b;
          cursor: pointer;
          padding: 0 8px;
          line-height: 1;
          transition: color 0.2s;
        }

        .clear-btn:hover:not(:disabled) {
          color: #dc2626;
        }

        .clear-btn:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .search-results {
          margin-top: 8px;
          max-height: 200px;
          overflow-y: auto;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
        }

        .search-result-item {
          padding: 12px;
          cursor: pointer;
          border-bottom: 1px solid #f3f4f6;
          transition: background-color 0.2s;
        }

        .search-result-item:last-child {
          border-bottom: none;
        }

        .search-result-item:hover {
          background-color: #f9fafb;
        }

        .member-name {
          font-weight: 600;
          color: #111827;
          margin-bottom: 4px;
        }

        .member-phone {
          font-size: 13px;
          color: #6b7280;
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

        .form-input:disabled {
          background-color: #f3f4f6;
          color: #6b7280;
          cursor: not-allowed;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .form-row .form-group {
          margin-bottom: 0;
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

export default AssignLockerModal;

