import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface NoticePost {
  id: string;
  title: string;
  content: string;
  authorName: string;
  createdAtText: string;
  commentCount: number;
}

export interface NoticeAuthor {
  authorName: string;
  authorEmail: string;
}

interface FirestoreNoticeDoc {
  title?: string;
  postTitle?: string;
  content?: string;
  authorName?: string;
  authorEmail?: string;
  createdAt?: unknown;
  commentCount?: number;
  comments?: unknown[];
}

const formatDate = (value: unknown): string => {
  if (!value) return '-';

  let parsedDate: Date | null = null;

  if (value instanceof Timestamp) {
    parsedDate = value.toDate();
  } else if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
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

const mapDocToNoticePost = (docSnap: { id: string; data: () => FirestoreNoticeDoc }): NoticePost => {
  const data = docSnap.data();
  const commentCount =
    typeof data.commentCount === 'number'
      ? data.commentCount
      : Array.isArray(data.comments)
        ? data.comments.length
        : 0;

  return {
    id: docSnap.id,
    title: data.title || data.postTitle || '(제목 없음)',
    content: data.content || '',
    authorName: data.authorName || '-',
    createdAtText: formatDate(data.createdAt),
    commentCount
  };
};

export class NoticeService {
  static async createNoticePost(
    boxName: string,
    payload: { title: string; content: string },
    author?: NoticeAuthor
  ): Promise<void> {
    if (!boxName) {
      throw new Error('박스 이름이 없습니다.');
    }

    const title = payload.title.trim();
    const content = payload.content.trim();

    if (!title) {
      throw new Error('공지 제목을 입력해주세요.');
    }

    const authorName = author?.authorName?.trim();
    if (!authorName) {
      throw new Error('작성자를 입력해주세요.');
    }

    await addDoc(collection(db, `box/${boxName}/notices`), {
      title,
      content,
      authorName,
      authorEmail: author?.authorEmail || '',
      commentCount: 0,
      comments: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  static async getNoticePosts(boxName: string): Promise<NoticePost[]> {
    try {
      if (!boxName) return [];

      const noticesQuery = query(
        collection(db, `box/${boxName}/notices`),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(noticesQuery);
      return snapshot.docs.map((docSnap) => mapDocToNoticePost(docSnap));
    } catch (error) {
      console.error('Failed to load notice posts:', error);
      return [];
    }
  }

  static async getRecentNoticePosts(boxName: string, count = 3): Promise<NoticePost[]> {
    try {
      if (!boxName) return [];

      const noticesQuery = query(
        collection(db, `box/${boxName}/notices`),
        orderBy('createdAt', 'desc'),
        limit(count)
      );

      const snapshot = await getDocs(noticesQuery);
      return snapshot.docs.map((docSnap) => mapDocToNoticePost(docSnap));
    } catch (error) {
      console.error('Failed to load recent notice posts:', error);
      return [];
    }
  }

  static async updateNoticePost(
    boxName: string,
    noticeId: string,
    payload: { title: string; content: string; authorName: string }
  ): Promise<void> {
    if (!boxName) {
      throw new Error('박스 이름이 없습니다.');
    }

    const title = payload.title.trim();
    const content = payload.content.trim();
    const authorName = payload.authorName.trim();

    if (!title) {
      throw new Error('공지 제목을 입력해주세요.');
    }

    if (!authorName) {
      throw new Error('작성자를 입력해주세요.');
    }

    await updateDoc(doc(db, `box/${boxName}/notices`, noticeId), {
      title,
      content,
      authorName,
      updatedAt: serverTimestamp()
    });
  }

  static async deleteNoticePost(boxName: string, noticeId: string): Promise<void> {
    if (!boxName) {
      throw new Error('박스 이름이 없습니다.');
    }

    await deleteDoc(doc(db, `box/${boxName}/notices`, noticeId));
  }
}
