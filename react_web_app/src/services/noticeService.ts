import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface NoticePost {
  id: string;
  title: string;
  createdAtText: string;
  commentCount: number;
}

interface FirestoreNoticeDoc {
  title?: string;
  postTitle?: string;
  content?: string;
  createdAt?: unknown;
  commentCount?: number;
  comments?: unknown[];
}

const formatDate = (value: unknown): string => {
  if (!value) return '-';

  let parsedDate: Date | null = null;

  if (value instanceof Timestamp) {
    parsedDate = value.toDate();
  } else if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    parsedDate = (value as { toDate: () => Date }).toDate();
  }

  if (!parsedDate) return '-';

  return parsedDate
    .toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
    .replace(/\s/g, '')
    .replace(/\.$/, '');
};

export class NoticeService {
  static async createNoticePost(boxName: string, payload: { title: string; content: string }): Promise<void> {
    if (!boxName) {
      throw new Error('박스 이름이 없습니다.');
    }

    const title = payload.title.trim();
    const content = payload.content.trim();

    if (!title) {
      throw new Error('공지 제목을 입력해주세요.');
    }

    await addDoc(collection(db, `box/${boxName}/notices`), {
      title,
      content,
      commentCount: 0,
      comments: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  static async getRecentNoticePosts(boxName: string): Promise<NoticePost[]> {
    try {
      if (!boxName) return [];

      const noticesQuery = query(
        collection(db, `box/${boxName}/notices`),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const snapshot = await getDocs(noticesQuery);

      return snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as FirestoreNoticeDoc;
        const commentCount =
          typeof data.commentCount === 'number'
            ? data.commentCount
            : Array.isArray(data.comments)
              ? data.comments.length
              : 0;

        return {
          id: docSnap.id,
          title: data.title || data.postTitle || '(제목 없음)',
          createdAtText: formatDate(data.createdAt),
          commentCount
        };
      });
    } catch (error) {
      console.error('Failed to load notice posts:', error);
      return [];
    }
  }
}
