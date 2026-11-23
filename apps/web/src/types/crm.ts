export interface MemberNoteAuthor {
  id: string;
  firstName: string;
  lastName: string;
}

export interface MemberNote {
  id: string;
  gymId: string;
  memberId: string;
  authorId: string;
  body: string;
  author: MemberNoteAuthor;
  createdAt: string;
  updatedAt: string;
}

export type MemberActivityType =
  | 'NOTE'
  | 'ATTENDANCE'
  | 'PAYMENT'
  | 'MEMBERSHIP'
  | 'RESERVATION';

export interface MemberActivity {
  id: string;
  type: MemberActivityType;
  date: string;
  title: string;
  description: string | null;
}
