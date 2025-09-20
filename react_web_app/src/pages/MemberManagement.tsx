import React, { useState, useEffect, useCallback } from 'react';
import { Search, Users, UserPlus, CreditCard, Eye, Trash2, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { Member, ToastMessageType } from '../types/member';
import { useMemberManagement } from '../hooks/useMemberManagement';
import MemberDetailsModal from '../components/modals/member/MemberDetailsModal';
import MemberDeletionModal from '../components/modals/member/MemberDeletionModal';
import MembershipPlanModal from '../components/modals/membership/MembershipPlanModal';
import ToastMessage from '../components/ToastMessage';
import { getGenderText, filterMembers } from '../utils/memberUtils';
import { usePageContext } from '../contexts/PageContext';

const MemberManagement = () => {
  const { setPageInfo } = usePageContext();
  
  // Firebase 연동 훅
  const {
    members,
    loading,
    error,
    loadMembers,
    deleteMember,
    updateMemberMembership,
    addMember,
    clearError
  } = useMemberManagement();

  // 상태 관리
  const [searchValue, setSearchValue] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [deletionModalVisible, setDeletionModalVisible] = useState(false);
  const [membershipPlanModalVisible, setMembershipPlanModalVisible] = useState(false);
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Toast message
  const [createToast, setCreateToast] = useState<((toast: ToastMessageType) => void) | null>(null);

  // 페이지 정보 설정
  useEffect(() => {
    setPageInfo({
      title: '회원 관리',
      subtitle: '회원 정보를 조회하고 관리하세요'
    });
  }, [setPageInfo]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // 에러 처리
  useEffect(() => {
    if (error && createToast) {
      createToast({
        type: 'danger',
        message: error
      });
      clearError();
    }
  }, [error, createToast, clearError]);

  // 검색된 회원 필터링
  const filteredMembers = filterMembers(members, searchValue);
  
  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMembers = filteredMembers.slice(startIndex, endIndex);
  
  // 검색어가 변경되면 첫 페이지로 이동
  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue]);

  // 회원 상세 보기
  const handleShowDetails = useCallback((member: Member) => {
    setSelectedMember(member);
    setDetailsModalVisible(true);
  }, []);

  // 회원 삭제
  const handleDeleteMember = useCallback((member: Member) => {
    setSelectedMember(member);
    setDeletionModalVisible(true);
  }, []);

  // 회원 삭제 실행
  const handleConfirmDelete = useCallback(async (email: string) => {
    try {
      await deleteMember(email);
      if (createToast) {
        createToast({
          type: 'success',
          message: '회원이 성공적으로 삭제되었습니다.'
        });
      }
    } catch (error) {
      console.error('Failed to delete member', error);
      if (createToast) {
        createToast({
          type: 'danger',
          message: '회원 삭제에 실패했습니다.'
        });
      }
    }
  }, [deleteMember, createToast]);

  // 회원권 관리 (임시 구현)
  const handleManageMembership = useCallback((member: Member) => {
    if (createToast) {
      createToast({
        type: 'info',
        message: '회원권 관리 기능은 준비 중입니다.'
      });
    }
  }, [createToast]);

  // 회원 추가 (임시 구현)
  const handleAddMember = useCallback(() => {
    if (createToast) {
      createToast({
        type: 'info',
        message: '회원 추가 기능은 준비 중입니다.'
      });
    }
  }, [createToast]);

  // 회원권 플랜 관리
  const handleManageMembershipPlans = useCallback(() => {
    setMembershipPlanModalVisible(true);
  }, []);

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 이전 페이지
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // 다음 페이지
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="dashboard">

      {/* 컨트롤 카드 */}
      <div className="content-card">
        <div className="card-header">
          <div className="header-left">
            <Users size={20} />
            <span>전체 회원: {members.length}명 | 검색 결과: {filteredMembers.length}명</span>
          </div>
          <div className="header-actions">
            <button className="btn btn-outline" onClick={handleAddMember}>
              <UserPlus size={16} />
              회원추가
            </button>
            <button className="btn btn-outline" onClick={handleManageMembershipPlans}>
              <CreditCard size={16} />
              회원권
            </button>
          </div>
        </div>

        <div className="search-section">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="이름, 닉네임, 이메일로 검색..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      {/* 회원 목록 카드 */}
      <div className="content-card" style={{ flex: 1 }}>
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>회원 정보를 불러오는 중...</p>
          </div>
        ) : (
          <div className="members-table-container">
            <div className="members-table">
              <div className="table-header">
                <div className="table-cell">이름</div>
                <div className="table-cell">닉네임</div>
                <div className="table-cell">등록 타입</div>
                <div className="table-cell">만료 일자</div>
                <div className="table-cell">잔여 기간</div>
                <div className="table-cell">잔여 횟수</div>
                <div className="table-cell">성별</div>
                <div className="table-cell">기능</div>
                <div className="table-cell">상세</div>
              </div>

              {filteredMembers.length === 0 ? (
                <div className="empty-state">
                  <Users size={48} className="empty-icon" />
                  <h3>회원이 없습니다</h3>
                  <p>{searchValue ? '검색 조건에 맞는 회원이 없습니다.' : '등록된 회원이 없습니다.'}</p>
                </div>
              ) : (
                currentMembers.map((member, index) => (
                  <div key={member.email} className="table-row">
                    <div className="table-cell">
                      <div className="member-name-cell">
                        <div className="member-avatar">
                          <Users size={16} />
                        </div>
                        <span>{member.realName}</span>
                      </div>
                    </div>
                    <div className="table-cell">{member.nickName}</div>
                    <div className="table-cell">
                      <span className="membership-badge">{member.membershipInfo.type}</span>
                    </div>
                    <div className="table-cell">{member.membershipInfo.expiryDate}</div>
                    <div className="table-cell">
                      <span className={`remaining-days ${member.membershipInfo.remainingDays <= 7 ? 'warning' : ''}`}>
                        {member.membershipInfo.remainingDays}일
                      </span>
                    </div>
                    <div className="table-cell">{member.membershipInfo.remainingVisits}회</div>
                    <div className="table-cell">{getGenderText(member.gender)}</div>
                    <div className="table-cell">
                      <div className="action-buttons">
                        <button 
                          className="btn btn-sm btn-info"
                          onClick={() => handleManageMembership(member)}
                          title="회원권 관리"
                        >
                          <Settings size={14} />
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteMember(member)}
                          title="회원 삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="table-cell">
                      <button 
                        className="btn btn-sm btn-light"
                        onClick={() => handleShowDetails(member)}
                        title="상세 정보"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* 페이지네이션 */}
            {filteredMembers.length > 0 && totalPages > 1 && (
              <div className="pagination-container">
                <div className="pagination-info">
                  <span>
                    {startIndex + 1}-{Math.min(endIndex, filteredMembers.length)} / {filteredMembers.length}명
                  </span>
                </div>
                
                <div className="pagination-controls">
                  <button 
                    className="pagination-btn" 
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  <div className="page-numbers">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        className={`page-number ${page === currentPage ? 'active' : ''}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button 
                    className="pagination-btn" 
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <MemberDetailsModal
        visible={detailsModalVisible}
        member={selectedMember}
        onClose={() => setDetailsModalVisible(false)}
      />

      <MemberDeletionModal
        visible={deletionModalVisible}
        member={selectedMember}
        onClose={() => setDeletionModalVisible(false)}
        onDelete={handleConfirmDelete}
      />

      <MembershipPlanModal
        visible={membershipPlanModalVisible}
        onClose={() => setMembershipPlanModalVisible(false)}
        onSuccess={(message) => {
          if (createToast) {
            createToast({
              type: 'success',
              message
            });
          }
        }}
        onError={(message) => {
          if (createToast) {
            createToast({
              type: 'danger',
              message
            });
          }
        }}
      />

      {/* Toast Messages */}
      <ToastMessage
        onCreateToast={(createToastFn: (toast: ToastMessageType) => void) => setCreateToast(() => createToastFn)}
      />

      <style>{`
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

        .btn-outline {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          font-size: 14px;
          padding: 6px 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-outline:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .search-section {
          margin-bottom: 0;
        }

        .search-container {
          position: relative;
          max-width: 400px;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .search-input {
          width: 100%;
          padding: 10px 12px 10px 40px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .members-table-container {
          overflow-x: auto;
        }

        .members-table {
          width: 100%;
          min-width: 800px;
        }

        .table-header {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 80px 120px 80px;
          gap: 16px;
          padding: 16px;
          background-color: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }

        .table-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 80px 120px 80px;
          gap: 16px;
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          transition: all 0.2s;
        }

        .table-row:hover {
          background-color: #f9fafb;
        }

        .table-cell {
          display: flex;
          align-items: center;
          font-size: 14px;
          color: #374151;
        }

        .member-name-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .member-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .membership-badge {
          background-color: #dbeafe;
          color: #1e40af;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .remaining-days {
          font-weight: 600;
        }

        .remaining-days.warning {
          color: #dc2626;
          background-color: #fee2e2;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .action-buttons {
          display: flex;
          gap: 6px;
        }

        .btn {
          padding: 8px 16px;
          border-radius: 6px;
          border: 1px solid;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-sm {
          padding: 6px 8px;
          font-size: 12px;
        }

        .btn-info {
          background-color: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .btn-info:hover {
          background-color: #2563eb;
          border-color: #2563eb;
        }

        .btn-danger {
          background-color: #dc2626;
          border-color: #dc2626;
          color: white;
        }

        .btn-danger:hover {
          background-color: #b91c1c;
          border-color: #b91c1c;
        }

        .btn-light {
          background-color: #f8fafc;
          border-color: #e2e8f0;
          color: #64748b;
        }

        .btn-light:hover {
          background-color: #f1f5f9;
          border-color: #cbd5e1;
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

        .pagination-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-top: 1px solid #e5e7eb;
          background-color: #f9fafb;
        }

        .pagination-info {
          font-size: 14px;
          color: #6b7280;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pagination-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: 1px solid #d1d5db;
          background-color: white;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          color: #6b7280;
        }

        .pagination-btn:hover:not(:disabled) {
          background-color: #f3f4f6;
          border-color: #9ca3af;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background-color: #f9fafb;
        }

        .page-numbers {
          display: flex;
          gap: 4px;
        }

        .page-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: 1px solid #d1d5db;
          background-color: white;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          color: #374151;
          font-size: 14px;
          font-weight: 500;
        }

        .page-number:hover {
          background-color: #f3f4f6;
          border-color: #9ca3af;
        }

        .page-number.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: #667eea;
          color: white;
        }

        .page-number.active:hover {
          background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
        }
      `}</style>
    </div>
  );
};

export default MemberManagement; 