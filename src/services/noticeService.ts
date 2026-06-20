import { NoticeAuthor, NoticePost, NoticeRepository } from '../repositories';

export type { NoticePost, NoticeAuthor };

export class NoticeService {
  static async createNoticePost(
    boxName: string,
    payload: { title: string; content: string },
    author?: NoticeAuthor
  ): Promise<void> {
    if (!boxName) throw new Error('박스 이름이 없습니다.');
    const title = payload.title.trim();
    const content = payload.content.trim();
    if (!title) throw new Error('공지 제목을 입력해주세요.');
    const authorName = author?.authorName?.trim();
    if (!authorName) throw new Error('작성자를 입력해주세요.');
    await NoticeRepository.create(boxName, { title, content }, {
      authorName,
      authorEmail: author!.authorEmail || '',
    });
  }

  static async getNoticePosts(boxName: string): Promise<NoticePost[]> {
    if (!boxName) return [];
    return NoticeRepository.list(boxName);
  }

  static async getRecentNoticePosts(boxName: string, count = 3): Promise<NoticePost[]> {
    if (!boxName) return [];
    return NoticeRepository.list(boxName, count);
  }

  static async updateNoticePost(
    boxName: string,
    noticeId: string,
    payload: { title: string; content: string; authorName: string }
  ): Promise<void> {
    if (!boxName) throw new Error('박스 이름이 없습니다.');
    const title = payload.title.trim();
    const content = payload.content.trim();
    const authorName = payload.authorName.trim();
    if (!title) throw new Error('공지 제목을 입력해주세요.');
    if (!authorName) throw new Error('작성자를 입력해주세요.');
    await NoticeRepository.update(boxName, noticeId, { title, content, authorName });
  }

  static async deleteNoticePost(boxName: string, noticeId: string): Promise<void> {
    if (!boxName) throw new Error('박스 이름이 없습니다.');
    await NoticeRepository.delete(boxName, noticeId);
  }
}
