import { serverRead, serverWrite } from '../../data/apiClient';
import { NoticeAuthor, NoticePost, NoticeRepository } from '../noticeRepository';
import { ServerNoticeRepository, ServerNoticeResponse } from '../server/serverNoticeRepository';

function formatServerDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  return new Date(iso)
    .toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .replace(/\s/g, '')
    .replace(/\.$/, '');
}

function toNoticePost(s: ServerNoticeResponse): NoticePost {
  return {
    id: s.id,
    title: s.title || '(제목 없음)',
    content: s.content || '',
    authorName: s.author_name || '-',
    createdAtText: formatServerDate(s.created_at),
    commentCount: s.comment_count,
  };
}

export class HybridNoticeRepository {
  static async list(boxName: string, maxCount?: number): Promise<NoticePost[]> {
    const serverPosts = await serverRead(
      async () => {
        const list = await ServerNoticeRepository.listByBox(boxName, maxCount ?? 200);
        return list.map(toNoticePost);
      },
      `Notice.list(${boxName})`
    );
    if (serverPosts && serverPosts.length > 0) return serverPosts;
    return NoticeRepository.list(boxName, maxCount);
  }

  static async create(
    boxName: string,
    payload: { title: string; content: string },
    author: NoticeAuthor
  ): Promise<void> {
    const now = new Date().toISOString();
    const id = await NoticeRepository.create(boxName, payload, author);
    serverWrite(
      () => ServerNoticeRepository.createNotice({
        id,
        box_name: boxName,
        title: payload.title,
        content: payload.content,
        author_name: author.authorName,
        author_email: author.authorEmail || null,
        created_at: now,
        updated_at: now,
      }),
      `Notice.create(${id})`
    );
  }

  static async update(
    boxName: string,
    noticeId: string,
    payload: { title: string; content: string; authorName: string }
  ): Promise<void> {
    const now = new Date().toISOString();
    await NoticeRepository.update(boxName, noticeId, payload);
    serverWrite(
      () => ServerNoticeRepository.updateNotice(noticeId, {
        title: payload.title,
        content: payload.content,
        author_name: payload.authorName,
        updated_at: now,
      }),
      `Notice.update(${noticeId})`
    );
  }

  static async delete(boxName: string, noticeId: string): Promise<void> {
    await NoticeRepository.delete(boxName, noticeId);
    serverWrite(
      () => ServerNoticeRepository.deleteNotice(noticeId),
      `Notice.delete(${noticeId})`
    );
  }
}
