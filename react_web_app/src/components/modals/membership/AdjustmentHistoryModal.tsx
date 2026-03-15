import { History, Calendar, User, FileText, ArrowRight, Square, Play } from 'lucide-react';
import { Gradients } from '../../../constants/gradients';
import { AppColors } from '../../../constants/colors';
import { Adjustment } from '../../../types/membership';

interface AdjustmentHistoryModalProps {
  visible: boolean;
  membershipPlan: string;
  adjustments: Adjustment[];
  onClose: () => void;
}

const AdjustmentHistoryModal = ({
  visible,
  membershipPlan,
  adjustments,
  onClose
}: AdjustmentHistoryModalProps) => {
  if (!visible) return null;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'edit': return '수정';
      case 'hold': return '홀딩';
      case 'hold_release': return '홀딩 해제';
      default: return '조정';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'edit': return AppColors.primary;
      case 'hold': return '#F59E0B';
      case 'hold_release': return '#16A34A';
      default: return '#64748b';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <History size={20} className="header-icon" />
            <h3>조정 이력</h3>
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="membership-info">
            <span className="plan-name">{membershipPlan}</span>
            <span className="adjustment-count">총 {adjustments.length}회 조정</span>
          </div>

          <div className="adjustments-list">
            {adjustments.map((adjustment, index) => (
              <div key={index} className="adjustment-item">
                <div className="adjustment-header">
                  <div className="adjustment-number-wrap">
                    <div className="adjustment-number">#{index + 1}</div>
                    <div
                      className="adjustment-type-badge"
                      style={{ backgroundColor: getTypeColor(adjustment.type) }}
                    >
                      {getTypeLabel(adjustment.type)}
                    </div>
                  </div>
                  <div className="adjustment-date">
                    <Calendar size={14} />
                    {formatDateTime(adjustment.at)}
                  </div>
                </div>

                <div className="adjustment-details">
                  {/* 홀딩 등록 정보 표시 */}
                  {adjustment.type === 'hold' && adjustment.hold && (
                    <div className="hold-info-box">
                      <Square size={16} />
                      <div className="hold-info-content">
                        <span className="hold-period">
                          {formatDate(adjustment.hold.startDate)} ~ {formatDate(adjustment.hold.endDate)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 홀딩 해제 정보 표시 */}
                  {adjustment.type === 'hold_release' && adjustment.hold && (
                    <div className="hold-release-info-box">
                      <Play size={16} />
                      <div className="hold-info-content">
                        <span className="hold-period">
                          {formatDate(adjustment.hold.startDate)} ~ {formatDate(adjustment.hold.endDate)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 기간 변경 표시 */}
                  {adjustment.before?.period && adjustment.after?.period && (
                    <div className="change-section">
                      <div className="change-label">기간</div>
                      <div className="period-change">
                        <div className="period-box before">
                          <span className="period-label">변경 전</span>
                          <span className="period-value">
                            {formatDate(adjustment.before.period.startDate)} ~ {formatDate(adjustment.before.period.endDate)}
                          </span>
                        </div>

                        <ArrowRight size={20} className="arrow-icon" />

                        <div className="period-box after">
                          <span className="period-label">변경 후</span>
                          <span className="period-value">
                            {formatDate(adjustment.after.period.startDate)} ~ {formatDate(adjustment.after.period.endDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 횟수 변경 표시 */}
                  {adjustment.before?.quota && adjustment.after?.quota && (
                    <div className="change-section">
                      <div className="change-label">횟수</div>
                      <div className="quota-change">
                        <div className="quota-box before">
                          <span className="quota-label">변경 전</span>
                          <span className="quota-value">
                            사용 {adjustment.before.quota.used}회 / 잔여 {adjustment.before.quota.remaining}회
                          </span>
                        </div>

                        <ArrowRight size={20} className="arrow-icon" />

                        <div className="quota-box after">
                          <span className="quota-label">변경 후</span>
                          <span className="quota-value">
                            사용 {adjustment.after.quota.used}회 / 잔여 {adjustment.after.quota.remaining}회
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="adjustment-info">
                    <div className="info-row">
                      <User size={14} />
                      <span className="info-label">담당자:</span>
                      <span className="info-value">{adjustment.assignee}</span>
                    </div>
                    <div className="info-row">
                      <FileText size={14} />
                      <span className="info-label">사유:</span>
                      <span className="info-value">{adjustment.reason}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            닫기
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
          max-height: 90vh;
        }

        .history-modal {
          max-width: 600px;
          width: 95%;
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

        .membership-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .plan-name {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
        }

        .adjustment-count {
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
        }

        .adjustments-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .adjustment-item {
          background: linear-gradient(135deg, #fefefe 0%, #f9fafb 100%);
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          transition: all 0.2s;
        }

        .adjustment-item:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          transform: translateY(-1px);
        }

        .adjustment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e5e7eb;
        }

        .adjustment-number-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .adjustment-number {
          background: ${Gradients.primary};
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .adjustment-type-badge {
          color: white;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }

        .adjustment-date {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #64748b;
        }

        .adjustment-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .hold-info-box {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 1px solid #fbbf24;
          border-radius: 8px;
        }

        .hold-info-box svg {
          color: #92400e;
        }

        .hold-release-info-box {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          border: 1px solid #6ee7b7;
          border-radius: 8px;
        }

        .hold-release-info-box svg {
          color: #065f46;
        }

        .hold-release-info-box .hold-period {
          color: #064e3b;
        }

        .hold-release-info-box .hold-days {
          color: #065f46;
        }

        .hold-info-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .hold-period {
          font-size: 14px;
          font-weight: 600;
          color: #78350f;
        }

        .hold-days {
          font-size: 12px;
          font-weight: 500;
          color: #92400e;
        }

        .change-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .change-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
        }

        .period-change,
        .quota-change {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .period-box,
        .quota-box {
          flex: 1;
          padding: 10px 12px;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .period-box.before,
        .quota-box.before {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          border: 1px solid #fca5a5;
        }

        .period-box.after,
        .quota-box.after {
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          border: 1px solid #6ee7b7;
        }

        .period-label,
        .quota-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .period-box.before .period-label,
        .quota-box.before .quota-label {
          color: #991b1b;
        }

        .period-box.after .period-label,
        .quota-box.after .quota-label {
          color: #065f46;
        }

        .period-value,
        .quota-value {
          font-size: 13px;
          font-weight: 600;
        }

        .period-box.before .period-value,
        .quota-box.before .quota-value {
          color: #7f1d1d;
        }

        .period-box.after .period-value,
        .quota-box.after .quota-value {
          color: #064e3b;
        }

        .arrow-icon {
          color: #9ca3af;
          flex-shrink: 0;
        }

        .adjustment-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-top: 8px;
          border-top: 1px solid #e5e7eb;
        }

        .info-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #374151;
        }

        .info-row svg {
          color: #9ca3af;
          flex-shrink: 0;
        }

        .info-label {
          font-weight: 500;
          color: #6b7280;
        }

        .info-value {
          font-weight: 600;
          color: #1f2937;
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
          font-weight: 600;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
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

export default AdjustmentHistoryModal;

