
import { Subject, Grade } from './types';

export const CBC_SUBJECTS: Subject[] = [
  { id: 'eng', name: 'English', category: 'CBC' },
  { id: 'kis', name: 'Kiswahili', category: 'CBC' },
  { id: 'mat', name: 'Mathematics', category: 'CBC' },
  { id: 'env', name: 'Environmental Activities', category: 'CBC' },
  { id: 'hyn', name: 'Hygiene & Nutrition', category: 'CBC' },
  { id: 'art', name: 'Creative Arts', category: 'CBC' },
  { id: 'rel', name: 'Religious Education', category: 'CBC' },
  { id: 'pe', name: 'Physical Education', category: 'CBC' },
];

export const JSS_SUBJECTS: Subject[] = [
  { id: 'eng_jss', name: 'English', category: 'JSS' },
  { id: 'kis_jss', name: 'Kiswahili', category: 'JSS' },
  { id: 'mat_jss', name: 'Mathematics', category: 'JSS' },
  { id: 'sci_jss', name: 'Integrated Science', category: 'JSS' },
  { id: 'soc_jss', name: 'Social Studies', category: 'JSS' },
  { id: 'pre_jss', name: 'Pre-Technical Studies', category: 'JSS' },
  { id: 'bus_jss', name: 'Business Studies', category: 'JSS' },
  { id: 'lif_jss', name: 'Life Skills', category: 'JSS' },
  { id: 'com_jss', name: 'Computer Studies', category: 'JSS' },
  { id: 'hea_jss', name: 'Health Education', category: 'JSS' },
];

export const GRADES: Grade[] = [
  'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
  'Grade 7', 'Grade 8', 'Grade 9'
];

export const YEARS = Array.from({ length: 40 }, (_, i) => 2001 + i);

export const getSubjectsForGrade = (grade: Grade): Subject[] => {
  const gradeNum = parseInt(grade.replace(/\D/g, ''));
  if (grade.startsWith('PP') || gradeNum <= 6) return CBC_SUBJECTS;
  return JSS_SUBJECTS;
};

export const getPerformanceLevel = (score: number) => {
  if (score >= 80) return 'Exceeding Expectations';
  if (score >= 60) return 'Meeting Expectations';
  if (score >= 40) return 'Approaching Expectations';
  return 'Below Expectations';
};
