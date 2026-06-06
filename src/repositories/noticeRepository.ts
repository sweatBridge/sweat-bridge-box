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
  updateDoc,
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

function formatDate(value: unknown): string {
  if (!value) return '-';

  let parsedDate: Date | null = null;

  if (value instanceof Date) {
    parsedDate = value;
  } else if (value instanceof Timestamp) {
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
    .toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .replace(/\s/g, '')
    .replace(/\.$/, '');
}

function mapDoc(docSnap: { id: string; data: () => FirestoreNoticeDoc }): NoticePost {
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
    commentCount,
  };
}

export class NoticeRepository {
  static async list(boxName: string, maxCount?: number): Promise<NoticePost[]> {
    const ref = collection(db, `box/${boxName}/notices`);
    const q = maxCount
      ? query(ref, orderBy('createdAt', 'desc'), limit(maxCount))
      : query(ref, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapDoc);
  }

  static async create(
    boxName: string,
    payload: { title: string; content: string },
    author: NoticeAuthor
  ): Promise<string> {
    const docRef = await addDoc(collection(db, `box/${boxName}/notices`), {
      title: payload.title,
      content: payload.content,
      authorName: author.authorName,
      authorEmail: author.authorEmail,
      commentCount: 0,
      comments: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  static async update(
    boxName: string,
    noticeId: string,
    payload: { title: string; content: string; authorName: string }
  ): Promise<void> {
    await updateDoc(doc(db, `box/${boxName}/notices`, noticeId), {
      title: payload.title,
      content: payload.content,
      authorName: payload.authorName,
      updatedAt: serverTimestamp(),
    });
  }

  static async delete(boxName: string, noticeId: string): Promise<void> {
    await deleteDoc(doc(db, `box/${boxName}/notices`, noticeId));
  }
}
