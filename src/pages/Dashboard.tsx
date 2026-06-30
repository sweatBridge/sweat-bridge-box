import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, UserCheck, UserPlus, AlertTriangle, FileText, Pencil, ExternalLink } from 'lucide-react';
import { ClassService } from '../services/classService';
import { ClassEvent } from '../types/class';
import { usePageContext } from '../contexts/PageContext';
import { useMemberManagement } from '../hooks/useMemberManagement';
import { MembershipService } from '../services/membershipService';
import { Member } from '../types/member';
import { DashboardMemoService } from '../services/dashboardMemoService';
import { NoticePost, NoticeService } from '../services/noticeService';

const Dashboard = () => {
  const boxName = localStorage.getItem('boxName') || 'SWEAT';
  const navigate = useNavigate();

  const [todayClasses, setTodayClasses] = useState<ClassEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [noticeLoading, setNoticeLoading] = useState(true);
  const [coachMemo, setCoachMemo] = useState('');
  const [noticePosts, setNoticePosts] = useState<NoticePost[]>([]);
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

  // 대시보드의 모든 초기 데이터(오늘 수업, 회원 목록, 코치 메모)를 단일 effect의 Promise.all로 묶어 병렬 로드.
  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        setLoading(true);
        const [classes, memo, notices] = await Promise.all([
          ClassService.getTodayClasses(boxName),
          DashboardMemoService.getCoachMemo(boxName).catch((error) => {
            console.error('Failed to load coach memo:', error);
            return '';
          }),
          NoticeService.getRecentNoticePosts(boxName, 3),
          loadMembers()
        ]);
        if (cancelled) return;
        setTodayClasses(classes);
        setCoachMemo(memo);
        setNoticePosts(notices);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setNoticeLoading(false);
        }
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, [loadMembers, boxName]);

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

  const handleEditNotice = (noticeId: string) => {
    navigate(`/notices?edit=${noticeId}`);
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
      tone: 'success' as const,
    },
    {
      title: '주의 회원',
      value: warningMembersCount.toString(),
      subtitle: '만료/부족 임박 회원',
      icon: AlertTriangle,
      tone: 'warning' as const,
    },
    {
      title: '신규 회원',
      value: newMembersCount.toString(),
      subtitle: '최근 등록 회원',
      icon: UserPlus,
      tone: 'primary' as const,
    },
  ];

  const StatCard = ({ title, value, subtitle, icon: Icon, tone }: {
    title: string;
    value: string;
    subtitle: string;
    icon: React.ElementType;
    tone: 'primary' | 'success' | 'warning';
  }) => (
    <div className="ds-stat">
      <div className="ds-stat__top">
        <div className={`ds-stat__icon${tone === 'primary' ? '' : ` ds-stat__icon--${tone}`}`}>
          <Icon />
        </div>
        <span className="ds-stat__label">{title}</span>
      </div>
      <div className="ds-stat__value">{value}</div>
      <span className="ds-stat__hint">{subtitle}</span>
    </div>
  );

  return (
    <div className="dashboard dashboard-page ds-page">
      {/* 통계 */}
      <div className="dash-stats">
        {statsData.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
            icon={stat.icon}
            tone={stat.tone}
          />
        ))}
      </div>

      {/* 오늘의 수업 + 코치 메모 */}
      <div className="dash-grid">
        {/* 오늘의 수업 일정 */}
        <div className="ds-card">
          <div className="ds-card__head">
            <div>
              <h3 className="ds-card__title">오늘의 수업 일정</h3>
              <p className="ds-card__subtitle">오늘 진행되는 수업과 예약 현황이에요</p>
            </div>
            <span className="ds-badge ds-badge--neutral">{todayClasses.length}개 수업</span>
          </div>

          {loading ? (
            <div className="ds-empty">
              <div className="ds-spinner"></div>
              <span className="ds-empty__desc">오늘 수업 일정을 불러오는 중...</span>
            </div>
          ) : todayClasses.length === 0 ? (
            <div className="ds-empty">
              <Calendar size={40} className="ds-empty__icon" />
              <span className="ds-empty__title">오늘 등록된 수업이 없습니다</span>
              <span className="ds-empty__desc">수업 관리에서 새 수업을 등록해보세요.</span>
            </div>
          ) : (
            <div className="dash-table-scroll">
              <table className="ds-table dash-class-table">
                <thead>
                  <tr>
                    <th>시간</th>
                    <th>수업명</th>
                    <th>코치</th>
                    <th>참여 인원</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {todayClasses.map((classItem) => {
                    const current = classItem.extendedProps.reserved.length;
                    const max = classItem.extendedProps.cap;
                    const isFullyBooked = current >= max;
                    const occupancyRate = max > 0 ? (current / max) * 100 : 0;

                    const startTime = new Date(classItem.start).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    });

                    return (
                      <tr key={classItem.id}>
                        <td><span className="time-badge">{startTime}</span></td>
                        <td><span className="class-name">{classItem.title}</span></td>
                        <td><span className="coach-name">{classItem.extendedProps.coach || '-'}</span></td>
                        <td>
                          <div className="participants-info">
                            <span className={`participants-count ${isFullyBooked ? 'full' : ''}`}>
                              {current}/{max}명
                            </span>
                            <div className="ds-meter">
                              <div
                                className={`ds-meter__fill${isFullyBooked ? ' ds-meter__fill--error' : occupancyRate > 80 ? ' ds-meter__fill--warning' : ''}`}
                                style={{ width: `${occupancyRate}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`ds-badge ${isFullyBooked ? 'ds-badge--error' : occupancyRate > 80 ? 'ds-badge--warning' : 'ds-badge--success'}`}>
                            {isFullyBooked ? '만석' : occupancyRate > 80 ? '마감임박' : '예약가능'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 코치진 전용 메모장 */}
        <div className="ds-card ds-card--pad coach-memo-panel">
          <div className="coach-memo-panel-header">
            <div className="coach-memo-title-wrap">
              <div className="ds-stat__icon"><FileText /></div>
              <h3 className="ds-card__title">코치진 전용 메모장</h3>
            </div>
          </div>
          <textarea
            className="coach-memo-textarea"
            value={coachMemo}
            onChange={(e) => setCoachMemo(e.target.value)}
            placeholder="코치진에게 공유할 메모를 입력하세요."
          />
          <div className="coach-memo-actions">
            {memoSavedAt && (
              <span className="coach-memo-saved-text">{memoSavedAt} 저장됨</span>
            )}
            <button className="ds-btn ds-btn--primary ds-btn--sm" onClick={handleSaveCoachMemo}>저장</button>
          </div>
        </div>
      </div>

      {/* 공지 + 최근 가입 회원 */}
      <div className="dash-grid">
        <div className="ds-card">
          <div className="ds-card__head">
            <div>
              <h3 className="ds-card__title">공지</h3>
              <p className="ds-card__subtitle">일정, 회원관리 등을 공지하고 확인할 수 있어요</p>
            </div>
            <button type="button" className="ds-btn ds-btn--ghost ds-btn--sm" onClick={() => navigate('/notices')}>
              <ExternalLink />
              공지 관리
            </button>
          </div>

          <div className="notice-board-list">
            {noticeLoading ? (
              <div className="ds-empty"><span className="ds-empty__desc">공지 게시글을 불러오는 중입니다.</span></div>
            ) : noticePosts.length === 0 ? (
              <div className="ds-empty"><span className="ds-empty__desc">아직 등록된 공지 게시글이 없습니다.</span></div>
            ) : (
              noticePosts.map((notice) => (
                <article key={notice.id} className="notice-dashboard-item">
                  <div className="notice-dashboard-item-top">
                    <h4 className="notice-dashboard-title">{notice.title}</h4>
                    <button
                      type="button"
                      className="notice-edit-link-btn"
                      onClick={() => handleEditNotice(notice.id)}
                    >
                      <Pencil size={13} />
                      수정
                    </button>
                  </div>
                  <p className="notice-dashboard-content">{notice.content || '(내용 없음)'}</p>
                  <div className="notice-dashboard-meta">
                    <span>작성자: {notice.authorName}</span>
                    <span>{notice.createdAtText}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        {/* 최근 가입 회원 */}
        <div className="ds-card">
          <div className="ds-card__head">
            <h3 className="ds-card__title">최근 가입 회원</h3>
          </div>
          <div className="member-list">
            {recentMembers.length === 0 ? (
              <div className="ds-empty">
                <Users size={40} className="ds-empty__icon" />
                <span className="ds-empty__desc">최근 가입한 회원이 없습니다.</span>
              </div>
            ) : (
              recentMembers.map((member, index) => (
                <div key={index} className="member-item">
                  <div className="ds-avatar">{member.name[0]}</div>
                  <div className="member-info">
                    <div className="member-name">{member.name}</div>
                    <div className="member-date">{member.date}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        .dash-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-4);
        }

        .dash-grid {
          display: grid;
          grid-template-columns: minmax(0, 2.2fr) minmax(300px, 1fr);
          gap: var(--space-4);
          align-items: start;
        }

        /* 오늘의 수업 테이블 */
        .dash-table-scroll {
          overflow-x: auto;
        }

        .dash-class-table {
          min-width: 560px;
        }

        .time-badge {
          display: inline-flex;
          background: var(--color-primary-bg);
          color: var(--color-primary);
          padding: 5px 10px;
          border-radius: var(--radius-sm);
          font-weight: 700;
          font-size: 13px;
          font-variant-numeric: tabular-nums;
        }

        .class-name {
          font-weight: 600;
          color: var(--text-strong);
        }

        .coach-name {
          color: var(--text-muted);
          font-size: 13px;
        }

        .participants-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 96px;
        }

        .participants-count {
          font-weight: 600;
          font-size: 13px;
          color: var(--text);
        }

        .participants-count.full {
          color: var(--error);
        }

        /* 코치 메모 */
        .coach-memo-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-4);
        }

        .coach-memo-title-wrap {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .coach-memo-textarea {
          width: 100%;
          min-height: 150px;
          resize: vertical;
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-md);
          padding: 12px 14px;
          font-size: 14px;
          line-height: 1.5;
          color: var(--text);
          font-family: inherit;
          background: var(--surface);
          transition: border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease);
        }

        .coach-memo-textarea:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(49, 130, 246, 0.14);
        }

        .coach-memo-actions {
          margin-top: var(--space-3);
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: var(--space-3);
        }

        .coach-memo-saved-text {
          font-size: 12px;
          color: var(--text-subtle);
        }

        /* 공지 리스트 */
        .notice-board-list {
          display: flex;
          flex-direction: column;
          padding: var(--space-2) var(--space-6) var(--space-4);
        }

        .notice-dashboard-item {
          padding: var(--space-4) 0;
          border-bottom: 1px solid var(--border);
        }

        .notice-dashboard-item:last-child {
          border-bottom: none;
        }

        .notice-dashboard-item-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 6px;
        }

        .notice-dashboard-title {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          color: var(--text-strong);
          flex: 1;
        }

        .notice-edit-link-btn {
          border: 1px solid var(--border-strong);
          background: var(--surface);
          border-radius: var(--radius-sm);
          padding: 5px 10px;
          font-size: 12px;
          font-weight: 600;
          color: var(--color-primary);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
          transition: background var(--dur) var(--ease), border-color var(--dur) var(--ease);
        }

        .notice-edit-link-btn:hover {
          border-color: var(--color-primary);
          background: var(--color-primary-bg);
        }

        .notice-dashboard-content {
          margin: 0 0 8px;
          font-size: 14px;
          line-height: 1.55;
          color: var(--text-muted);
          white-space: pre-wrap;
          word-break: break-word;
        }

        .notice-dashboard-meta {
          display: flex;
          gap: 14px;
          font-size: 12px;
          color: var(--text-subtle);
        }

        /* 최근 가입 회원 */
        .member-list {
          display: flex;
          flex-direction: column;
          padding: var(--space-2) var(--space-6) var(--space-4);
        }

        .member-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: 10px 0;
          border-bottom: 1px solid var(--border);
        }

        .member-item:last-child {
          border-bottom: none;
        }

        .member-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .member-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-strong);
        }

        .member-date {
          font-size: 12px;
          color: var(--text-subtle);
        }

        @media (max-width: 1024px) {
          .dash-stats { grid-template-columns: 1fr; }
          .dash-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 640px) {
          .notice-dashboard-item-top { flex-direction: column; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard; 
