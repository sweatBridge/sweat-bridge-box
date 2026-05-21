import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import NoticeIcon from '../components/icons/NoticeIcon';
import { usePageContext } from '../contexts/PageContext';
import { useAuth } from '../contexts/AuthContext';
import { AppColors } from '../constants/colors';
import { Gradients } from '../constants/gradients';
import { NoticePost, NoticeService } from '../services/noticeService';

const ITEMS_PER_PAGE = 5;

const NoticeManagement = () => {
  const boxName = localStorage.getItem('boxName') || 'SWEAT';
  const { user } = useAuth();
  const { setPageInfo } = usePageContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const [notices, setNotices] = useState<NoticePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<NoticePost | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setPageInfo({
      title: '공지',
      subtitle: '박스 공지를 작성하고 관리하세요'
    });
  }, [setPageInfo]);

  const loadNotices = useCallback(async () => {
    try {
      setLoading(true);
      const posts = await NoticeService.getNoticePosts(boxName);
      setNotices(posts);
    } catch (err) {
      console.error('Failed to load notices:', err);
    } finally {
      setLoading(false);
    }
  }, [boxName]);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  const defaultAuthorName = user?.realName || user?.nickName || '';

  const openEditor = useCallback((notice?: NoticePost) => {
    if (notice) {
      setEditingId(notice.id);
      setTitle(notice.title);
      setAuthorName(notice.authorName === '-' ? '' : notice.authorName);
      setContent(notice.content);
    } else {
      setEditingId(null);
      setTitle('');
      setAuthorName(defaultAuthorName);
      setContent('');
    }
    setIsEditorOpen(true);
    setError('');
  }, [defaultAuthorName]);

  const closeEditor = useCallback(() => {
    setIsEditorOpen(false);
    setEditingId(null);
    setTitle('');
    setAuthorName('');
    setContent('');
    setError('');
    setSearchParams({});
  }, [setSearchParams]);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId || notices.length === 0) return;

    const target = notices.find((n) => n.id === editId);
    if (target) {
      openEditor(target);
      setSearchParams({});
    }
  }, [searchParams, notices, openEditor, setSearchParams]);

  const totalPages = Math.max(1, Math.ceil(notices.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedNotices = useMemo(
    () => notices.slice(startIndex, endIndex),
    [notices, startIndex, endIndex]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [notices.length]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    const trimmedAuthor = authorName.trim();
    if (!trimmedTitle) {
      setError('공지 제목을 입력해주세요.');
      return;
    }
    if (!trimmedAuthor) {
      setError('작성자를 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      if (editingId) {
        await NoticeService.updateNoticePost(boxName, editingId, {
          title: trimmedTitle,
          content,
          authorName: trimmedAuthor
        });
      } else {
        await NoticeService.createNoticePost(
          boxName,
          { title: trimmedTitle, content },
          { authorName: trimmedAuthor, authorEmail: user?.email || '' }
        );
      }

      await loadNotices();
      closeEditor();
    } catch (err) {
      console.error('Failed to save notice:', err);
      setError('공지 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await NoticeService.deleteNoticePost(boxName, deleteTarget.id);
      setDeleteTarget(null);
      await loadNotices();
    } catch (err) {
      console.error('Failed to delete notice:', err);
      setError('공지 삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="notice-page">
      <div className="notice-page-header">
        <div className="notice-page-header-left">
          <div className="notice-page-icon-wrap">
            <NoticeIcon size={22} className="notice-page-icon" />
          </div>
          <div>
            <h2 className="notice-page-title">공지 관리</h2>
            <p className="notice-page-subtitle">제목·내용·작성자를 확인하고 수정·삭제할 수 있습니다</p>
          </div>
        </div>
        <button type="button" className="notice-page-add-btn" onClick={() => openEditor()}>
          <Plus size={16} />
          공지 추가
        </button>
      </div>

      {isEditorOpen && (
        <div className="notice-editor-card">
          <div className="notice-editor-card-title">{editingId ? '공지 수정' : '공지 작성'}</div>
          <input
            type="text"
            className="notice-input"
            placeholder="공지 제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
          />
          <input
            type="text"
            className="notice-input"
            placeholder="작성자"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            maxLength={40}
          />
          <textarea
            className="notice-textarea"
            placeholder="공지 내용을 입력하세요."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={2000}
          />
          <div className="notice-editor-actions">
            <button type="button" className="notice-cancel-btn" onClick={closeEditor} disabled={submitting}>
              취소
            </button>
            <button type="button" className="notice-submit-btn" onClick={handleSave} disabled={submitting}>
              {submitting ? '저장 중...' : '저장'}
            </button>
          </div>
          {error && <div className="notice-error-text">{error}</div>}
        </div>
      )}

      <div className="notice-list-card">
        {loading ? (
          <div className="notice-empty">공지를 불러오는 중입니다.</div>
        ) : notices.length === 0 ? (
          <div className="notice-empty">등록된 공지가 없습니다. 공지 추가 버튼으로 작성해주세요.</div>
        ) : (
          <>
            <div className="notice-list">
              {paginatedNotices.map((notice) => (
                <article key={notice.id} className="notice-item">
                  <div className="notice-item-header">
                    <h3 className="notice-item-title">{notice.title}</h3>
                    <div className="notice-item-actions">
                      <button
                        type="button"
                        className="notice-action-btn edit"
                        onClick={() => openEditor(notice)}
                        title="수정"
                      >
                        <Pencil size={16} />
                        수정
                      </button>
                      <button
                        type="button"
                        className="notice-action-btn delete"
                        onClick={() => setDeleteTarget(notice)}
                        title="삭제"
                      >
                        <Trash2 size={16} />
                        삭제
                      </button>
                    </div>
                  </div>
                  <p className="notice-item-content">{notice.content || '(내용 없음)'}</p>
                  <div className="notice-item-meta">
                    <span>작성자: {notice.authorName}</span>
                    <span>{notice.createdAtText}</span>
                  </div>
                </article>
              ))}
            </div>

            {notices.length > ITEMS_PER_PAGE && (
              <div className="pagination-container">
                <div className="pagination-info">
                  <span>
                    {startIndex + 1}-{Math.min(endIndex, notices.length)} / {notices.length}건
                  </span>
                </div>
                <div className="pagination-controls">
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="page-numbers">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        className={`page-number ${page === currentPage ? 'active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {deleteTarget && (
        <div className="notice-modal-overlay" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="notice-modal" onClick={(e) => e.stopPropagation()}>
            <h3>공지 삭제</h3>
            <p>
              「{deleteTarget.title}」 공지를 삭제할까요?
              <br />
              삭제 후에는 복구할 수 없습니다.
            </p>
            <div className="notice-modal-actions">
              <button
                type="button"
                className="notice-cancel-btn"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                취소
              </button>
              <button type="button" className="notice-delete-confirm-btn" onClick={handleDelete} disabled={deleting}>
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .notice-page {
          max-width: 960px;
        }

        .notice-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
        }

        .notice-page-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .notice-page-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(37, 99, 235, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notice-page-icon {
          width: 22px;
          height: 22px;
          color: ${AppColors.primary};
        }

        .notice-page-title {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
          color: #111827;
        }

        .notice-page-subtitle {
          margin: 4px 0 0;
          font-size: 14px;
          color: #6b7280;
        }

        .notice-page-add-btn {
          border: none;
          background: ${AppColors.primary};
          color: #fff;
          border-radius: 999px;
          padding: 10px 18px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }

        .notice-page-add-btn:hover {
          background: ${AppColors.primaryHover};
        }

        .notice-editor-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .notice-editor-card-title {
          font-size: 15px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 12px;
        }

        .notice-input,
        .notice-textarea {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-family: inherit;
          font-size: 14px;
          color: #1f2937;
          background: #fff;
        }

        .notice-input {
          height: 40px;
          padding: 0 12px;
          margin-bottom: 8px;
        }

        .notice-textarea {
          min-height: 120px;
          resize: vertical;
          padding: 10px 12px;
          line-height: 1.5;
        }

        .notice-input:focus,
        .notice-textarea:focus {
          outline: none;
          border-color: ${AppColors.primary};
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }

        .notice-editor-actions {
          margin-top: 12px;
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .notice-cancel-btn,
        .notice-submit-btn,
        .notice-delete-confirm-btn {
          border: none;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 16px;
          cursor: pointer;
        }

        .notice-cancel-btn {
          color: #374151;
          background: #e5e7eb;
        }

        .notice-submit-btn {
          color: #fff;
          background: ${AppColors.primary};
        }

        .notice-delete-confirm-btn {
          color: #fff;
          background: ${AppColors.error};
        }

        .notice-submit-btn:disabled,
        .notice-cancel-btn:disabled,
        .notice-delete-confirm-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .notice-error-text {
          margin-top: 8px;
          font-size: 13px;
          color: ${AppColors.error};
        }

        .notice-list-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          overflow: hidden;
        }

        .notice-list {
          display: flex;
          flex-direction: column;
        }

        .notice-item {
          padding: 18px 20px;
          border-bottom: 1px solid #f3f4f6;
        }

        .notice-item:last-child {
          border-bottom: none;
        }

        .notice-item-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 8px;
        }

        .notice-item-title {
          margin: 0;
          font-size: 17px;
          font-weight: 600;
          color: #111827;
          flex: 1;
        }

        .notice-item-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }

        .notice-action-btn {
          border: 1px solid #e5e7eb;
          background: #fff;
          border-radius: 8px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #374151;
        }

        .notice-action-btn.edit:hover {
          border-color: ${AppColors.primary};
          color: ${AppColors.primary};
        }

        .notice-action-btn.delete:hover {
          border-color: ${AppColors.error};
          color: ${AppColors.error};
        }

        .notice-item-content {
          margin: 0 0 10px;
          font-size: 14px;
          line-height: 1.6;
          color: #374151;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .notice-item-meta {
          display: flex;
          gap: 16px;
          font-size: 13px;
          color: #6b7280;
        }

        .notice-empty {
          padding: 48px 20px;
          text-align: center;
          color: #9ca3af;
          font-size: 15px;
        }

        .pagination-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 20px;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
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
          border-radius: 6px;
          background: #fff;
          cursor: pointer;
        }

        .pagination-btn:hover:not(:disabled) {
          background: #f3f4f6;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-numbers {
          display: flex;
          gap: 4px;
        }

        .page-number {
          min-width: 32px;
          height: 32px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: #fff;
          font-size: 13px;
          cursor: pointer;
        }

        .page-number.active {
          background: ${Gradients.primary};
          color: #fff;
          border-color: transparent;
        }

        .notice-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .notice-modal {
          background: #fff;
          border-radius: 12px;
          padding: 24px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        .notice-modal h3 {
          margin: 0 0 12px;
          font-size: 18px;
          color: #111827;
        }

        .notice-modal p {
          margin: 0 0 20px;
          font-size: 14px;
          line-height: 1.5;
          color: #4b5563;
        }

        .notice-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        @media (max-width: 640px) {
          .notice-page-header {
            flex-direction: column;
          }

          .notice-item-header {
            flex-direction: column;
          }

          .pagination-container {
            flex-direction: column;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default NoticeManagement;
