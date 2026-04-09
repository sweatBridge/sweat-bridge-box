import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Users, UserCheck, UserPlus, AlertTriangle, FileText } from 'lucide-react';
import { AppColors } from '../constants/colors';
import { ClassService } from '../services/classService';
import { ClassEvent } from '../types/class';
import { usePageContext } from '../contexts/PageContext';
import { Gradients } from '../constants/gradients';
import { useMemberManagement } from '../hooks/useMemberManagement';
import { MembershipService } from '../services/membershipService';
import { Member } from '../types/member';
import { DashboardMemoService } from '../services/dashboardMemoService';

const Dashboard = () => {
  const boxName = localStorage.getItem('boxName') || 'SWEAT';

  const [todayClasses, setTodayClasses] = useState<ClassEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [coachMemo, setCoachMemo] = useState('');
  const [memoSavedAt, setMemoSavedAt] = useState<string>('');
  const { setPageInfo } = usePageContext();
  
  // 회원 관리 훅
  const {
    members,
    loadMembers
  } = useMemberManagement();

  // 페이지 정보 설정
  useEffect(() => {
    setPageInfo({
      title: '대시보드',
      subtitle: '오늘의 박스 현황을 확인하세요'
    });
  }, [setPageInfo]);

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // 병렬로 데이터 로드
        const [classes] = await Promise.all([
          ClassService.getTodayClasses(boxName),
          loadMembers() // 회원 데이터도 로드
        ]);
        
        setTodayClasses(classes);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [loadMembers, boxName]);

  useEffect(() => {
    const loadCoachMemo = async () => {
      try {
        const memo = await DashboardMemoService.getCoachMemo(boxName);
        setCoachMemo(memo);
      } catch (error) {
        console.error('Failed to load coach memo:', error);
      }
    };

    loadCoachMemo();
  }, [boxName]);

  const handleSaveCoachMemo = async () => {
    try {
      await DashboardMemoService.saveCoachMemo(boxName, coachMemo);
      setMemoSavedAt(new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
      }));
    } catch (error) {
      console.error('Failed to save coach memo:', error);
    }
  };

  // 회원 통계 및 신규 회원 목록 계산 (getMemberStatusBadge 한 번만 호출)
  const {
    activeMembersCount,
    warningMembersCount,
    newMembersCount,
    totalMembersCount,
    recentMembers
  } = useMemo(() => {
    let active = 0;
    let warning = 0;
    let newMembers = 0;
    const newMembersList: Member[] = [];
    
    members.forEach(member => {
      const memberStatusBadge = MembershipService.getMemberStatusBadge(member);
      
      if (memberStatusBadge.status === '신규') {
        newMembers++;
        newMembersList.push(member);
      } else if (memberStatusBadge.status === '활성') {
        active++;
      } else if (memberStatusBadge.status === '주의') {
        warning++;
      }
    });
    
    // 신규 회원 목록: 가입일 기준 최신순 정렬, 최대 5명
    const recentMembersList = newMembersList
      .sort((a, b) => {
        const dateA = a.joinedAt?.toDate() || new Date(0);
        const dateB = b.joinedAt?.toDate() || new Date(0);
        return dateB.getTime() - dateA.getTime(); // 최신순
      })
      .slice(0, 5) // 최대 5명만
      .map(member => {
        const joinedDate = member.joinedAt?.toDate() || new Date(0);
        const dateStr = joinedDate.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        
        return {
          name: member.realName,
          date: dateStr
        };
      });
    
    return {
      activeMembersCount: active,
      warningMembersCount: warning,
      newMembersCount: newMembers,
      totalMembersCount: active + warning + newMembers,
      recentMembers: recentMembersList
    };
  }, [members]);

  // 통계 데이터
  const statsData = [
    {
      title: '활성 회원',
      value: activeMembersCount.toString(),
      subtitle: `총 회원: ${totalMembersCount}명`,
      icon: UserCheck,
    },
    {
      title: '주의 회원',
      value: warningMembersCount.toString(),
      subtitle: '만료/부족 임박 회원',
      icon: AlertTriangle,
    },
    {
      title: '신규 회원',
      value: newMembersCount.toString(),
      subtitle: '최근 등록 회원',
      icon: UserPlus,
    },
  ];

  const StatCard = ({ title, value, subtitle, icon: Icon }: {
    title: string;
    value: string;
    subtitle: string;
    icon: React.ElementType;
  }) => (
    <div className="summary-card">
      <div className="summary-card-left">
        <div className="summary-icon-wrap">
          <Icon className="summary-icon" />
        </div>
        <div className="summary-text-wrap">
          <div className="summary-title">{title}</div>
          <div className="summary-subtitle">{subtitle}</div>
        </div>
      </div>
      <div className="summary-value">{value}</div>
    </div>
  );

  return (
    <div className="dashboard dashboard-page">
      <div className="dashboard-top-layout">
        <div className="summary-cards-column">
          {statsData.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              subtitle={stat.subtitle}
              icon={stat.icon}
            />
          ))}
        </div>

        <div className="coach-memo-panel">
          <div className="coach-memo-panel-header">
            <div className="coach-memo-title-wrap">
              <div className="summary-icon-wrap">
                <FileText className="summary-icon" />
              </div>
              <div>
                <div className="summary-title">코치진 전용 메모장</div>
              </div>
            </div>
          </div>
          <textarea
            className="coach-memo-textarea"
            value={coachMemo}
            onChange={(e) => setCoachMemo(e.target.value)}
            placeholder="코치진에게 공유할 메모를 입력하세요."
          />
          <div className="coach-memo-actions">
            <button className="coach-memo-save-pill" onClick={handleSaveCoachMemo}>저장</button>
            {memoSavedAt && (
              <span className="coach-memo-saved-text">{memoSavedAt} 저장됨</span>
            )}
          </div>
        </div>
      </div>
      
      {/* 최근 활동 섹션 */}
      <div className="content-grid">
        {/* 오늘의 수업 일정 */}
        <div className="content-card">
          <div className="card-header">
            <div className="header-left">
              <span>오늘의 수업 일정</span>
            </div>
            <div className="header-actions">
              <span className="class-count">{todayClasses.length}개 수업</span>
            </div>
          </div>
          
          <div className="classes-table-container">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>오늘 수업 일정을 불러오는 중...</p>
              </div>
            ) : todayClasses.length === 0 ? (
              <div className="empty-state">
                <Calendar size={48} className="empty-icon" />
                <h3>오늘 등록된 수업이 없습니다</h3>
                <p>수업 관리에서 새 수업을 등록해보세요.</p>
              </div>
            ) : (
              <div className="classes-table">
                <div className="table-header">
                  <div className="table-cell">시간</div>
                  <div className="table-cell">수업명</div>
                  <div className="table-cell">코치</div>
                  <div className="table-cell">참여 인원</div>
                  <div className="table-cell">상태</div>
                </div>
                
                {todayClasses.map((classItem, index) => {
                  const current = classItem.extendedProps.reserved.length;
                  const max = classItem.extendedProps.cap;
                  const isFullyBooked = current >= max;
                  const occupancyRate = max > 0 ? (current / max) * 100 : 0;
                  
                  // 시간 추출 (start 시간에서)
                  const startTime = new Date(classItem.start).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  });
                  
                  return (
                    <div key={classItem.id} className="table-row">
                      <div className="table-cell">
                        <div className="class-time-cell">
                          <div className="time-badge">{startTime}</div>
                        </div>
                      </div>
                      <div className="table-cell">
                        <span className="class-name">{classItem.title}</span>
                      </div>
                      <div className="table-cell">
                        <span className="coach-name">{classItem.extendedProps.coach || '-'}</span>
                      </div>
                      <div className="table-cell">
                        <div className="participants-info">
                          <span className={`participants-count ${isFullyBooked ? 'full' : ''}`}>
                            {current}/{max}명
                          </span>
                          <div className="occupancy-bar">
                            <div 
                              className="occupancy-fill" 
                              style={{ width: `${occupancyRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="table-cell">
                        <span className={`status-badge ${isFullyBooked ? 'full' : occupancyRate > 80 ? 'almost-full' : 'available'}`}>
                          {isFullyBooked ? '만석' : occupancyRate > 80 ? '마감임박' : '예약가능'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        {/* 최근 가입 회원 */}
        <div className="content-card">
          <h3 className="content-card-title">최근 가입 회원</h3>
          {recentMembers.length === 0 ? (
            <div className="empty-state">
              <Users size={48} className="empty-icon" />
              <p>최근 가입한 회원이 없습니다.</p>
            </div>
          ) : (
            recentMembers.map((member, index) => (
              <div key={index} className="member-item">
                <div className="member-avatar">
                  {member.name[0]}
                </div>
                <div className="member-info">
                  <div className="member-name">{member.name}</div>
                  <div className="member-date">{member.date}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        .dashboard-page .dashboard-top-layout {
          display: grid;
          grid-template-columns: minmax(300px, 0.9fr) minmax(420px, 1.4fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .summary-cards-column {
          display: grid;
          grid-template-rows: repeat(3, minmax(84px, 1fr));
          gap: 12px;
        }

        .summary-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .summary-card-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .summary-icon-wrap {
          width: 32px;
          height: 32px;
          border-radius: 999px;
          background: rgba(37, 99, 235, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .summary-icon {
          width: 18px;
          height: 18px;
          color: ${AppColors.primary};
          stroke: ${AppColors.primary};
        }

        .summary-title {
          font-size: 14px;
          font-weight: 500;
          color: #111827;
          line-height: 1.2;
        }

        .summary-subtitle {
          margin-top: 2px;
          font-size: 12px;
          font-weight: 400;
          color: #6b7280;
        }

        .summary-value {
          font-size: 42px;
          line-height: 1;
          font-weight: 500;
          color: #111827;
          padding-left: 12px;
        }

        .coach-memo-panel {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 14px 18px;
        }

        .coach-memo-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .coach-memo-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .coach-memo-save-pill {
          border: none;
          background: ${AppColors.primary};
          color: #fff;
          border-radius: 999px;
          padding: 6px 18px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .coach-memo-save-pill:hover {
          background: ${AppColors.primaryHover};
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: ${Gradients.primary};
          color: white;
          border-radius: 8px 8px 0 0;
          margin: -20px -20px 20px -20px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }

        .class-count {
          background: rgba(255, 255, 255, 0.2);
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
        }

        .classes-table-container {
          overflow-x: auto;
        }

        .dashboard-page .classes-table {
          width: 100%;
          min-width: 600px;
        }

        .dashboard-page .table-header {
          display: grid;
          grid-template-columns: 120px 1fr 120px 150px 120px;
          gap: 16px;
          padding: 16px;
          background-color: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }

        .dashboard-page .table-row {
          display: grid;
          grid-template-columns: 120px 1fr 120px 150px 120px;
          gap: 16px;
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          transition: all 0.2s;
        }

        .dashboard-page .table-row:hover {
          background-color: #f9fafb;
        }

        .dashboard-page .table-cell {
          display: flex;
          align-items: center;
          font-size: 14px;
          color: #374151;
        }

        .class-time-cell {
          display: flex;
          align-items: center;
        }

        .time-badge {
          background: ${Gradients.primary};
          color: white;
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
        }

        .class-name {
          font-weight: 600;
          color: #1f2937;
        }

        .coach-name {
          color: #6b7280;
          font-size: 13px;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #f3f4f6;
          border-top: 3px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-container p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }

        .empty-icon {
          color: #9ca3af;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          margin: 0 0 8px 0;
          color: #374151;
          font-size: 18px;
        }

        .empty-state p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .participants-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 100%;
        }

        .participants-count {
          font-weight: 600;
          font-size: 13px;
        }

        .participants-count.full {
          color: #dc2626;
        }

        .occupancy-bar {
          width: 100%;
          height: 4px;
          background-color: #e5e7eb;
          border-radius: 2px;
          overflow: hidden;
        }

        .occupancy-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981 0%, #059669 50%, #dc2626 100%);
          transition: width 0.3s ease;
          border-radius: 2px;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          text-align: center;
        }

        .status-badge.available {
          background-color: #d1fae5;
          color: #065f46;
        }

        .status-badge.almost-full {
          background-color: #fef3c7;
          color: #92400e;
        }

        .status-badge.full {
          background-color: #fee2e2;
          color: #991b1b;
        }

        .coach-memo-textarea {
          margin-top: 2px;
          width: 100%;
          min-height: 165px;
          resize: vertical;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 13px;
          line-height: 1.4;
          color: #374151;
          font-family: inherit;
          background: #ffffff;
        }

        .coach-memo-textarea:focus {
          outline: none;
          border-color: ${AppColors.primary};
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }

        .coach-memo-actions {
          margin-top: 10px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
        }

        .coach-memo-saved-text {
          font-size: 12px;
          color: #64748b;
        }

        @media (max-width: 1024px) {
          .dashboard-page .dashboard-top-layout {
            grid-template-columns: 1fr;
          }

          .summary-cards-column {
            grid-template-rows: none;
          }
        }

        .dashboard-page .content-grid {
          grid-template-columns: minmax(0, 2.6fr) minmax(280px, 1fr);
          gap: 20px;
        }
      `}</style>
    </div>
  );
};

export default Dashboard; 
