
export type UserRole = 'ADMIN' | 'TEACHER' | 'ACCOUNTANT' | 'HEAD_TEACHER';

export enum PerformanceLevel {
  EE = 'Exceeding Expectations',
  ME = 'Meeting Expectations',
  AE = 'Approaching Expectations',
  BE = 'Below Expectations'
}

export type Grade = 'PP1' | 'PP2' | 'Grade 1' | 'Grade 2' | 'Grade 3' | 'Grade 4' | 'Grade 5' | 'Grade 6' | 'Grade 7' | 'Grade 8' | 'Grade 9';

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  username: string;
}

export interface TermCalendar {
  term: 1 | 2 | 3;
  year: number;
  startDate: string;
  endDate: string;
  activities: { id: string; title: string; date: string }[];
}

export interface Student {
  id: string;
  fullName: string;
  admissionNumber: string;
  grade: Grade;
  stream: string;
  gender: 'Male' | 'Female' | 'Other';
  parentName: string;
  phoneNumber: string;
  term: 1 | 2 | 3;
  year: number;
  totalFees?: number;
  paidFees?: number;
}

export interface Subject {
  id: string;
  name: string;
  category: 'CBC' | 'JSS';
}

export interface Assessment {
  studentId: string;
  subjectId: string;
  score: number;
  performanceLevel: PerformanceLevel;
  remarks: string;
  term: number;
  year: number;
}

export interface FeePayment {
  id: string;
  studentId: string;
  amount: number;
  date: string;
  method: 'Cash' | 'M-Pesa' | 'Bank';
  category: 'Tuition' | 'Activity' | 'Exam' | 'Lunch' | 'Transport' | 'Boarding';
}

export interface AppState {
  students: Student[];
  assessments: Assessment[];
  payments: FeePayment[];
  currentUser: AuthUser | null;
  calendar: TermCalendar[];
}
