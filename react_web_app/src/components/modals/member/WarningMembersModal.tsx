import { Member } from '../../../types/member';
import { 
  formatPhoneNumber, 
  getGenderText 
} from '../../../utils/memberUtils';
import { Gradients } from '../../../constants/gradients';
import { AlertTriangle, X } from 'lucide-react';

interface WarningMembersModalProps {
  visible: boolean;
  members: Member[];
  onClose: () => void;
  onMemberClick?: (member: Member) => void;
}

const WarningMembersModal = ({ visible, members, onClose, onMemberClick }: WarningMembersModalProps) => {
  if (!visible) return null;

  const getWarningMessage = (member: Member) => {
    const { type, remainingDays, remainingVisits } = member.membershipInfo;
    
    if (type === 'countPass' || type === '횟수권') {
      const visits = typeof remainingVisits === 'string' 
        ? parseInt(remainingVisits) 
        : remainingVisits;
      return `${visits}회`;
    } else if (type === 'periodPass' || type === '기간권') {
      const days = typeof remainingDays === 'string' 
        ? parseInt(remainingDays) 
        : remainingDays;
      return `${days}일`;
    }
    
    return '-';
  };

  const getWarningLevel = (member: Member): 'danger' | 'warning' => {
    const { type, remainingDays, remainingVisits } = member.membershipInfo;
    
    if (type === 'countPass' || type === '횟수권') {
      const visits = typeof remainingVisits === 'string' 
        ? parseInt(remainingVisits) 
        : remainingVisits;
      return visits <= 3 ? 'danger' : 'warning';
    } else if (type === 'periodPass' || type === '기간권') {
      const days = typeof remainingDays === 'string' 
        ? parseInt(remainingDays) 
        : remainingDays;
      return days <= 7 ? 'danger' : 'warning';
    }
    
    return 'warning';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-content">
            <AlertTriangle size={24} className="warning-icon" />
            <h3>주의 회원 목록</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="modal-description">
            <p>회원권 만료가 임박한 회원 목록입니다.</p>
            <div className="legend">
              <span className="legend-item danger">
                <span className="legend-dot"></span>
                <strong>위험</strong> - 횟수권 3회 이하 / 기간권 7일 이내
              </span>
              <span className="legend-item warning">
                <span className="legend-dot"></span>
                <strong>주의</strong> - 횟수권 4~6회 / 기간권 8~14일
              </span>
            </div>
          </div>

          {members.length === 0 ? (
            <div className="empty-state">
              <AlertTriangle size={48} className="empty-icon" />
              <p>주의 회원이 없습니다.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="members-table">
                <thead>
                  <tr>
                    <th className="text-center">상태</th>
                    <th>이름</th>
                    <th>성별</th>
                    <th>연락처</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => {
                    const warningLevel = getWarningLevel(member);
                    return (
                      <tr 
                        key={member.email}
                        className={onMemberClick ? 'clickable' : ''}
                        onClick={() => onMemberClick?.(member)}
                      >
                        <td className="text-center">
                          <span className={`status-badge ${warningLevel}`}>
                            {getWarningMessage(member)}
                          </span>
                        </td>
                        <td className="member-name">{member.realName}</td>
                        <td>{getGenderText(member.gender)}</td>
                        <td>{formatPhoneNumber(member.phone)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <p className="footer-text">총 {members.length}명</p>
          <button className="btn-close" onClick={onClose}>닫기</button>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-container {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 800px;
          max-height: 85vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 28px;
          border-bottom: 1px solid #e5e7eb;
          background: ${Gradients.primary};
          color: white;
        }

        .modal-header-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .warning-icon {
          color: #fbbf24;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
        }

        .modal-close {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          cursor: pointer;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .modal-body {
          padding: 28px;
          overflow-y: auto;
          flex: 1;
        }

        .modal-description {
          margin-bottom: 24px;
        }

        .modal-description p {
          color: #6b7280;
          font-size: 14px;
          margin: 0 0 12px 0;
        }

        .legend {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          background: #f9fafb;
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #374151;
        }

        .legend-item strong {
          font-weight: 600;
        }

        .legend-item.danger .legend-dot {
          background: #dc2626;
          box-shadow: 0 0 0 2px #fee2e2;
        }

        .legend-item.warning .legend-dot {
          background: #f59e0b;
          box-shadow: 0 0 0 2px #fef3c7;
        }

        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: #9ca3af;
        }

        .empty-icon {
          margin-bottom: 16px;
        }

        .empty-state p {
          margin: 0;
          font-size: 14px;
        }

        .table-container {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow-x: auto;
        }

        .members-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .members-table thead {
          background: #f9fafb;
        }

        .members-table th {
          padding: 12px 14px;
          text-align: left;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
        }

        .members-table th.text-center {
          text-align: center;
          width: 100px;
        }

        .members-table th:nth-child(2) {
          width: 10%;
        }

        .members-table th:nth-child(3) {
          width: 10%;
        }

        .members-table th:nth-child(4) {
          width: auto;
        }

        .members-table td {
          padding: 14px;
          font-size: 14px;
          color: #374151;
          border-bottom: 1px solid #f3f4f6;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .members-table td.text-center {
          text-align: center;
        }

        .members-table tbody tr:last-child td {
          border-bottom: none;
        }

        .members-table tbody tr.clickable {
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .members-table tbody tr.clickable:hover {
          background-color: #f9fafb;
        }

        .member-name {
          font-weight: 600;
          color: #1f2937;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          border: none;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .status-badge.danger {
          background: #dc2626;
          color: white;
        }

        .status-badge.warning {
          background: #f59e0b;
          color: white;
        }

        .modal-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 28px;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .footer-text {
          margin: 0;
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }

        .btn-close {
          background: ${Gradients.primary};
          border: none;
          color: white;
          font-size: 14px;
          font-weight: 500;
          padding: 10px 24px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-close:hover {
          background: ${Gradients.primaryHover};
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .modal-container {
            max-width: 100%;
            max-height: 90vh;
          }

          .modal-body {
            padding: 20px;
          }

          .members-table {
            table-layout: auto;
          }

          .members-table th,
          .members-table td {
            padding: 12px 8px;
            font-size: 12px;
          }

          .legend {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default WarningMembersModal;

