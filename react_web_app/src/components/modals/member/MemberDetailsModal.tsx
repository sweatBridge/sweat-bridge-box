import React from 'react';
import { User, Mail, Phone, Calendar, Users, Clock, CreditCard } from 'lucide-react';
import { MemberDetailsModalProps } from '../../../types/member';
import { getGenderText, formatPhoneNumber } from '../../../utils/memberUtils';

const MemberDetailsModal = ({ visible, member, onClose }: MemberDetailsModalProps) => {
  if (!visible || !member) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content member-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <User size={20} className="header-icon" />
            <h3>회원 상세 정보</h3>
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {/* 기본 정보 섹션 */}
          <div className="info-section">
            <h4 className="section-title">기본 정보</h4>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-icon">
                  <User size={16} />
                </div>
                <div className="info-content">
                  <span className="info-label">이름</span>
                  <span className="info-value">{member.realName}</span>
                </div>
              </div>
              
              <div className="info-item">
                <div className="info-icon">
                  <User size={16} />
                </div>
                <div className="info-content">
                  <span className="info-label">닉네임</span>
                  <span className="info-value">{member.nickName}</span>
                </div>
              </div>
              
              <div className="info-item">
                <div className="info-icon">
                  <Mail size={16} />
                </div>
                <div className="info-content">
                  <span className="info-label">이메일</span>
                  <span className="info-value">{member.email}</span>
                </div>
              </div>
              
              <div className="info-item">
                <div className="info-icon">
                  <Phone size={16} />
                </div>
                <div className="info-content">
                  <span className="info-label">전화번호</span>
                  <span className="info-value">{formatPhoneNumber(member.phoneNumber)}</span>
                </div>
              </div>
              
              <div className="info-item">
                <div className="info-icon">
                  <Users size={16} />
                </div>
                <div className="info-content">
                  <span className="info-label">성별</span>
                  <span className="info-value">{getGenderText(member.gender)}</span>
                </div>
              </div>
              
              <div className="info-item">
                <div className="info-icon">
                  <Calendar size={16} />
                </div>
                <div className="info-content">
                  <span className="info-label">생년월일</span>
                  <span className="info-value">{member.birthDate || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 멤버십 정보 섹션 */}
          <div className="info-section">
            <h4 className="section-title">멤버십 정보</h4>
            <div className="membership-card">
              <div className="membership-header">
                <CreditCard size={20} />
                <span className="membership-type">{member.membershipInfo.type}</span>
              </div>
              
              <div className="membership-details">
                <div className="membership-item">
                  <Clock size={16} />
                  <div>
                    <span className="membership-label">만료일</span>
                    <span className="membership-value">{member.membershipInfo.expiryDate}</span>
                  </div>
                </div>
                
                <div className="membership-item">
                  <Calendar size={16} />
                  <div>
                    <span className="membership-label">잔여 기간</span>
                    <span className="membership-value">{member.membershipInfo.remainingDays}일</span>
                  </div>
                </div>
                
                <div className="membership-item">
                  <Users size={16} />
                  <div>
                    <span className="membership-label">잔여 횟수</span>
                    <span className="membership-value">{member.membershipInfo.remainingVisits}회</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>

      <style>{`
        .member-details-modal {
          max-width: 600px;
          width: 95%;
        }

        .info-section {
          margin-bottom: 24px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .info-item {
          display: flex;
          align-items: center;
          padding: 12px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .info-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .info-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 50%;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .info-content {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .info-label {
          font-size: 12px;
          font-weight: 500;
          color: #6b7280;
          margin-bottom: 2px;
        }

        .info-value {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }

        .membership-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 20px;
          color: white;
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
        }

        .membership-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .membership-type {
          font-size: 18px;
          font-weight: 700;
        }

        .membership-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
        }

        .membership-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .membership-item div {
          display: flex;
          flex-direction: column;
        }

        .membership-label {
          font-size: 12px;
          opacity: 0.8;
          margin-bottom: 2px;
        }

        .membership-value {
          font-size: 14px;
          font-weight: 600;
        }

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
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

        .modal-footer {
          display: flex;
          justify-content: flex-end;
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

        .btn-secondary {
          background-color: #ffffff;
          border-color: #d1d5db;
          color: #374151;
        }

        .btn-secondary:hover {
          background-color: #f9fafb;
          border-color: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default MemberDetailsModal; 