import React from 'react';
import { Calendar, Users, CheckCircle, TrendingUp } from 'lucide-react';
import { AppColors } from '../constants/colors';

const Dashboard: React.FC = () => {
  const statsData = [
    {
      title: '오늘 수업',
      value: '8',
      subtitle: '진행 중: 2개',
      icon: Calendar,
      color: AppColors.primary,
    },
    {
      title: '등록 회원',
      value: '124',
      subtitle: '이번 달 +12명',
      icon: Users,
      color: AppColors.success,
    },
    {
      title: '오늘 출석',
      value: '45',
      subtitle: '출석률 78%',
      icon: CheckCircle,
      color: AppColors.info,
    },
    {
      title: '월 매출',
      value: '₩2.4M',
      subtitle: '전월 대비 +8%',
      icon: TrendingUp,
      color: AppColors.warning,
    },
  ];

  const todayClasses = [
    { time: '09:00', name: 'Morning WOD', participants: '12/15' },
    { time: '10:30', name: 'Strength Training', participants: '8/12' },
    { time: '18:00', name: 'Evening WOD', participants: '18/20' },
    { time: '19:30', name: 'Open Gym', participants: '5/10' },
  ];

  const recentMembers = [
    { name: '김철수수', date: '2024-01-15' },
    { name: '이영희', date: '2024-01-14' },
    { name: '박민수', date: '2024-01-13' },
    { name: '정수진', date: '2024-01-12' },
    { name: '최동훈', date: '2024-01-11' },
  ];

  const StatCard: React.FC<{
    title: string;
    value: string;
    subtitle: string;
    icon: React.ElementType;
    color: string;
  }> = ({ title, value, subtitle, icon: Icon, color }) => (
    <div className="stat-card">
      <div className="stat-card-header">
        <div 
          className="stat-card-icon-container"
          style={{ backgroundColor: `${color}1A` }}
        >
          <Icon className="stat-card-icon" style={{ color }} />
        </div>
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-title">{title}</div>
      <div className="stat-card-subtitle">{subtitle}</div>
    </div>
  );

  return (
    <div className="dashboard">
      {/* 페이지 제목 */}
      <h1 className="dashboard-title">대시보드</h1>
      <p className="dashboard-subtitle">오늘의 박스 현황을 확인하세요</p>
      
      {/* 통계 카드들 */}
      <div className="stats-grid">
        {statsData.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>
      
      {/* 최근 활동 섹션 */}
      <div className="content-grid">
        {/* 오늘의 수업 일정 */}
        <div className="content-card">
          <h3 className="content-card-title">오늘의 수업 일정</h3>
          {todayClasses.map((classItem, index) => (
            <div key={index} className="class-item">
              <div className="class-time">{classItem.time}</div>
              <div className="class-name">{classItem.name}</div>
              <div className="class-participants">{classItem.participants}</div>
            </div>
          ))}
        </div>
        
        {/* 최근 가입 회원 */}
        <div className="content-card">
          <h3 className="content-card-title">최근 가입 회원</h3>
          {recentMembers.map((member, index) => (
            <div key={index} className="member-item">
              <div className="member-avatar">
                {member.name[0]}
              </div>
              <div className="member-info">
                <div className="member-name">{member.name}</div>
                <div className="member-date">{member.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 