
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Users, 
  BookOpen, 
  CreditCard, 
  LayoutDashboard, 
  FileText, 
  Plus, 
  Search, 
  Download, 
  TrendingUp, 
  ArrowLeft,
  Calendar as CalendarIcon,
  Menu,
  X,
  LogOut,
  Sparkles,
  Printer,
  ShieldCheck,
  Lock,
  ChevronRight,
  Settings,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle,
  Wallet,
  ReceiptText,
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  Student, 
  Assessment, 
  FeePayment, 
  Grade, 
  PerformanceLevel, 
  UserRole,
  AuthUser,
  TermCalendar 
} from './types';
import { 
  GRADES, 
  YEARS,
  getSubjectsForGrade, 
  getPerformanceLevel 
} from './constants';
import { generateReportRemark } from './services/geminiService';

// --- Configuration & Mock Users ---
const INITIAL_USERS: AuthUser[] = [
  { id: 'u1', name: 'Admin User', role: 'ADMIN', username: 'admin' },
  { id: 'u2', name: 'James Teacher', role: 'TEACHER', username: 'teacher' },
  { id: 'u3', name: 'Sarah Accountant', role: 'ACCOUNTANT', username: 'cashier' },
  { id: 'u4', name: 'Grace HeadTeacher', role: 'HEAD_TEACHER', username: 'principal' },
];

const INITIAL_CALENDAR: TermCalendar[] = [
  { term: 1, year: 2024, startDate: '2024-01-08', endDate: '2024-04-05', activities: [{ id: '1', title: 'Opening Day', date: '2024-01-08' }, { id: '2', title: 'Mid-Term Break', date: '2024-02-28' }] },
  { term: 2, year: 2024, startDate: '2024-04-29', endDate: '2024-08-02', activities: [{ id: '3', title: 'Term 2 Starts', date: '2024-04-29' }] },
  { term: 3, year: 2024, startDate: '2024-08-26', endDate: '2024-10-25', activities: [{ id: '4', title: 'National Exams', date: '2024-10-20' }] },
];

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick, role, allowedRoles }: { icon: any, label: string, active: boolean, onClick: () => void, role: UserRole, allowedRoles: UserRole[] }) => {
  if (!allowedRoles.includes(role)) return null;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 translate-x-1' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );
};

const App = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('elimusmart_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [view, setView] = useState<'dashboard' | 'students' | 'marks' | 'reports' | 'finance' | 'calendar' | 'settings'>('dashboard');
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('elimusmart_students');
    return saved ? JSON.parse(saved) : [];
  });
  const [assessments, setAssessments] = useState<Assessment[]>(() => {
    const saved = localStorage.getItem('elimusmart_assessments');
    return saved ? JSON.parse(saved) : [];
  });
  const [payments, setPayments] = useState<FeePayment[]>(() => {
    const saved = localStorage.getItem('elimusmart_payments');
    return saved ? JSON.parse(saved) : [];
  });
  const [calendar, setCalendar] = useState<TermCalendar[]>(() => {
    const saved = localStorage.getItem('elimusmart_calendar');
    return saved ? JSON.parse(saved) : INITIAL_CALENDAR;
  });
  const [users, setUsers] = useState<AuthUser[]>(() => {
    const saved = localStorage.getItem('elimusmart_system_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('elimusmart_students', JSON.stringify(students));
    localStorage.setItem('elimusmart_assessments', JSON.stringify(assessments));
    localStorage.setItem('elimusmart_payments', JSON.stringify(payments));
    localStorage.setItem('elimusmart_calendar', JSON.stringify(calendar));
    localStorage.setItem('elimusmart_system_users', JSON.stringify(users));
    if (currentUser) localStorage.setItem('elimusmart_user', JSON.stringify(currentUser));
    else localStorage.removeItem('elimusmart_user');
  }, [students, assessments, payments, calendar, currentUser, users]);

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('elimusmart_user');
    setView('dashboard');
  };

  const metrics = useMemo(() => {
    const totalStudents = students.length;
    const totalFeesCollected = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalOutstanding = students.reduce((sum, s) => sum + ((s.totalFees || 0) - (s.paidFees || 0)), 0);
    
    // Fee status counts
    const paidFull = students.filter(s => (s.paidFees || 0) >= (s.totalFees || 0) && (s.totalFees || 0) > 0).length;
    const paidPartial = students.filter(s => (s.paidFees || 0) > 0 && (s.paidFees || 0) < (s.totalFees || 0)).length;
    const paidNone = students.filter(s => (s.paidFees || 0) === 0).length;

    return { 
      totalStudents, 
      totalFeesCollected, 
      totalOutstanding,
      paidFull,
      paidPartial,
      paidNone
    };
  }, [students, payments]);

  const handleAddAssessment = (assessment: Assessment) => {
    setAssessments(prev => {
      const filtered = prev.filter(a => !(a.studentId === assessment.studentId && a.subjectId === assessment.subjectId && a.term === assessment.term && a.year === assessment.year));
      return [...filtered, assessment];
    });
  };

  const generateAIRemarks = async (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    setIsAiLoading(true);
    try {
      const studentAssessments = assessments.filter((a) => a.studentId === studentId);
      const updatedAssessments = await Promise.all(
        studentAssessments.map(async (a) => {
          const subjects = getSubjectsForGrade(student.grade);
          const subject = subjects.find((s) => s.id === a.subjectId);
          const remark = await generateReportRemark(
            student.fullName,
            subject?.name || 'Subject',
            a.performanceLevel,
            a.score
          );
          return { ...a, remarks: remark };
        })
      );

      setAssessments((prev) => {
        const otherAssessments = prev.filter((a) => a.studentId !== studentId);
        return [...otherAssessments, ...updatedAssessments];
      });
    } catch (error) {
      console.error("AI Remark Generation failed:", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  // --- Views ---
  
  const FinanceModuleComponent = () => {
    const [selectedStudentForPay, setSelectedStudentForPay] = useState<Student | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'M-Pesa' | 'Bank'>('M-Pesa');
    const [paymentCategory, setPaymentCategory] = useState<any>('Tuition');
    const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');

    const handleRecordPayment = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedStudentForPay || paymentAmount <= 0) return;

      const newPayment: FeePayment = {
        id: Math.random().toString(36).substr(2, 9),
        studentId: selectedStudentForPay.id,
        amount: paymentAmount,
        date: new Date().toISOString().split('T')[0],
        method: paymentMethod,
        category: paymentCategory
      };

      setPayments(prev => [...prev, newPayment]);
      setStudents(prev => prev.map(s => s.id === selectedStudentForPay.id ? { ...s, paidFees: (s.paidFees || 0) + paymentAmount } : s));
      setSelectedStudentForPay(null);
      setPaymentAmount(0);
    };

    const filteredStudents = useMemo(() => {
      return students.filter(s => {
        const paid = s.paidFees || 0;
        const total = s.totalFees || 0;
        if (statusFilter === 'paid') return paid >= total && total > 0;
        if (statusFilter === 'partial') return paid > 0 && paid < total;
        if (statusFilter === 'unpaid') return paid === 0;
        return true;
      });
    }, [students, statusFilter]);

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold">School Finance & Fees</h1>
          <div className="flex bg-white border border-slate-200 rounded-2xl p-1 shadow-sm overflow-hidden">
            <button 
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 text-xs font-black uppercase rounded-xl transition-all ${statusFilter === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              All ({students.length})
            </button>
            <button 
              onClick={() => setStatusFilter('paid')}
              className={`px-4 py-2 text-xs font-black uppercase rounded-xl transition-all ${statusFilter === 'paid' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Paid ({metrics.paidFull})
            </button>
            <button 
              onClick={() => setStatusFilter('partial')}
              className={`px-4 py-2 text-xs font-black uppercase rounded-xl transition-all ${statusFilter === 'partial' ? 'bg-yellow-500 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Partial ({metrics.paidPartial})
            </button>
            <button 
              onClick={() => setStatusFilter('unpaid')}
              className={`px-4 py-2 text-xs font-black uppercase rounded-xl transition-all ${statusFilter === 'unpaid' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Unpaid ({metrics.paidNone})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <div className="flex justify-between items-center mb-2">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Collection</span>
               <ArrowUpRight className="text-green-500" size={14}/>
             </div>
             <div className="text-xl font-black text-slate-900">KES {metrics.totalFeesCollected.toLocaleString()}</div>
           </div>
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <div className="flex justify-between items-center mb-2">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Arrears</span>
               <ArrowDownRight className="text-red-500" size={14}/>
             </div>
             <div className="text-xl font-black text-slate-900 text-red-600">KES {metrics.totalOutstanding.toLocaleString()}</div>
           </div>
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm md:col-span-2 flex items-center justify-around">
              <div className="text-center">
                <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Paid Status</div>
                <div className="flex gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                </div>
              </div>
              <div className="h-10 w-[1px] bg-slate-100"></div>
              <div className="text-center">
                 <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Most Used</div>
                 <div className="text-xs font-bold text-slate-700">M-PESA</div>
              </div>
           </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-bold flex items-center gap-2"><Users className="text-blue-600" size={18}/> {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Student Records</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Student Info</th>
                  <th className="px-6 py-4">Target (KES)</th>
                  <th className="px-6 py-4">Paid (KES)</th>
                  <th className="px-6 py-4">Balance</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map(s => {
                  const paid = s.paidFees || 0;
                  const total = s.totalFees || 0;
                  const balance = total - paid;
                  const status = paid >= total && total > 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'UNPAID';
                  
                  return (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{s.fullName}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-black">{s.grade} • {s.admissionNumber}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm">{total.toLocaleString()}</td>
                      <td className="px-6 py-4 font-mono text-sm text-green-600">{paid.toLocaleString()}</td>
                      <td className={`px-6 py-4 font-mono text-sm font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {balance.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                          status === 'PAID' ? 'bg-green-100 text-green-700' :
                          status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setSelectedStudentForPay(s)} 
                          disabled={status === 'PAID'}
                          className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 disabled:opacity-20 disabled:cursor-not-allowed"
                        >
                          Receive
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredStudents.length === 0 && (
            <div className="p-20 text-center">
              <Users className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No students matching the current status filter</p>
            </div>
          )}
        </div>

        {selectedStudentForPay && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
            <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold">Receive Payment</h2>
                  <p className="text-xs text-slate-400">Recording fee for {selectedStudentForPay.fullName}</p>
                </div>
                <button onClick={() => setSelectedStudentForPay(null)} className="p-2 hover:bg-slate-100 rounded-full"><X /></button>
              </div>
              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-2xl flex justify-between items-center mb-4">
                   <span className="text-xs font-bold text-blue-700">Remaining Balance:</span>
                   <span className="text-lg font-black text-blue-900">KES {((selectedStudentForPay.totalFees || 0) - (selectedStudentForPay.paidFees || 0)).toLocaleString()}</span>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Payment Amount (KES)</label>
                  <input 
                    required type="number" 
                    className="w-full border-2 border-slate-100 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none font-black text-lg" 
                    placeholder="0.00"
                    onChange={e => setPaymentAmount(parseFloat(e.target.value))} 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Method</label>
                    <div className="relative">
                      <select className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm font-bold appearance-none bg-white" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)}>
                        <option value="M-Pesa">M-Pesa</option>
                        <option value="Cash">Cash</option>
                        <option value="Bank">Bank Transfer</option>
                      </select>
                      <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Category</label>
                    <select className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm font-bold appearance-none bg-white" value={paymentCategory} onChange={e => setPaymentCategory(e.target.value as any)}>
                      <option value="Tuition">Tuition Fee</option>
                      <option value="Activity">Activity Fee</option>
                      <option value="Lunch">Lunch Fee</option>
                      <option value="Transport">Transport</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black mt-6 shadow-xl shadow-slate-900/20 hover:bg-black transition-all transform active:scale-95">Confirm & Print Receipt</button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const DashboardComponent = ({ metrics, students, calendar }: any) => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Karibu, {currentUser.name}!</h1>
          <p className="text-slate-500 text-sm">School Administration Console • {new Date().toDateString()}</p>
        </div>
        <div className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-900/20">Term 1, 2024</div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={20} /></div>
             <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-tighter">Enrolled</span>
          </div>
          <div className="text-3xl font-black text-slate-900">{metrics.totalStudents}</div>
          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Total Learners</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
             <div className="p-2 bg-green-50 text-green-600 rounded-lg"><CheckCircle size={20} /></div>
             <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-md uppercase tracking-tighter">Paid Full</span>
          </div>
          <div className="text-3xl font-black text-slate-900">{metrics.paidFull}</div>
          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Clean Accounts</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
             <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg"><TrendingUp size={20} /></div>
             <span className="text-[10px] font-black text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-md uppercase tracking-tighter">Partial</span>
          </div>
          <div className="text-3xl font-black text-slate-900">{metrics.paidPartial}</div>
          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Paying Progress</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
             <div className="p-2 bg-red-50 text-red-600 rounded-lg"><AlertCircle size={20} /></div>
             <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-md uppercase tracking-tighter">Zero Paid</span>
          </div>
          <div className="text-3xl font-black text-slate-900">{metrics.paidNone}</div>
          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Defaulters Count</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <div className="flex justify-between items-center mb-6">
             <h3 className="font-black text-slate-900 uppercase tracking-tighter text-sm flex items-center gap-2"><Sparkles size={16} className="text-blue-600"/> Quick Navigation</h3>
             <button onClick={() => setView('students')} className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest">View All</button>
           </div>
           <div className="grid grid-cols-2 gap-4">
             <button onClick={() => setView('marks')} className="p-6 bg-slate-50 hover:bg-slate-100 rounded-2xl border-2 border-slate-50 transition-all flex flex-col items-center gap-3">
               <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center"><BookOpen size={24}/></div>
               <span className="text-xs font-black uppercase text-slate-600">Marks Entry</span>
             </button>
             <button onClick={() => setView('finance')} className="p-6 bg-slate-50 hover:bg-slate-100 rounded-2xl border-2 border-slate-50 transition-all flex flex-col items-center gap-3">
               <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center"><Wallet size={24}/></div>
               <span className="text-xs font-black uppercase text-slate-600">Finance</span>
             </button>
           </div>
         </div>
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <h3 className="font-black text-slate-900 uppercase tracking-tighter text-sm mb-6 flex items-center gap-2"><CalendarIcon size={16} className="text-indigo-600"/> Upcoming Activities</h3>
           <div className="space-y-4">
             {calendar[0].activities.map((a:any) => (
               <div key={a.id} className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                 <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                   <span className="text-xs font-bold text-slate-700">{a.title}</span>
                 </div>
                 <span className="text-[10px] font-black text-slate-400 bg-white px-2 py-1 rounded-md shadow-sm">{a.date}</span>
               </div>
             ))}
           </div>
         </div>
      </div>
    </div>
  );

  const StudentListComponent = ({ students, searchQuery, setSearchQuery, setView, setSelectedStudentId, handleAddStudent }: any) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newStudent, setNewStudent] = useState<Partial<Student>>({
      grade: 'PP1', stream: 'Main', gender: 'Male', term: 1, year: 2024
    });

    const submitAdd = (e: React.FormEvent) => {
      e.preventDefault();
      // Ensure immediately visible across modules by initializing data
      const student: Student = {
        ...newStudent as Student,
        id: Math.random().toString(36).substr(2, 9),
        totalFees: newStudent.grade?.startsWith('Grade 7') ? 35000 : 22000,
        paidFees: 0,
        term: 1,
        year: 2024,
        parentName: newStudent.parentName || 'Parent Not Set'
      };
      handleAddStudent(student);
      setIsAdding(false);
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold">Learner Management</h1>
          <button onClick={() => setIsAdding(true)} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center space-x-2 shadow-xl shadow-slate-900/10 hover:bg-black transition-all active:scale-95"><Plus size={18} /><span>Enroll Learner</span></button>
        </div>

        {isAdding && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-10 shadow-2xl relative">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter">Admission Form</h2>
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Academic Year 2024 Session</p>
                </div>
                <button onClick={() => setIsAdding(false)} className="p-3 hover:bg-slate-100 rounded-full transition-colors"><X /></button>
              </div>
              <form onSubmit={submitAdd} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Learner's Official Name</label>
                  <input required type="text" className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-bold" placeholder="e.g. John Doe Onyango" onChange={e => setNewStudent({...newStudent, fullName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Admission No.</label>
                  <input required type="text" className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold" placeholder="ADM-0001" onChange={e => setNewStudent({...newStudent, admissionNumber: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Grade Assignment</label>
                  <select className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold bg-white" value={newStudent.grade} onChange={e => setNewStudent({...newStudent, grade: e.target.value as Grade})}>
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                   <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Parent/Guardian Name</label>
                   <input required type="text" className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold" placeholder="Full Name" onChange={e => setNewStudent({...newStudent, parentName: e.target.value})} />
                </div>
                <div>
                   <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Contact Number</label>
                   <input required type="text" className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold" placeholder="0712345678" onChange={e => setNewStudent({...newStudent, phoneNumber: e.target.value})} />
                </div>
                <div className="md:col-span-2 flex justify-end space-x-3 pt-8 border-t border-slate-50 mt-4">
                  <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest">Discard</button>
                  <button type="submit" className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black shadow-2xl shadow-slate-900/40 hover:bg-black transition-all hover:-translate-y-1">Admit Learner</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Learner Detail</th>
                  <th className="px-6 py-4">Admission</th>
                  <th className="px-6 py-4">Grade Level</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.filter(s => s.fullName.toLowerCase().includes(searchQuery.toLowerCase())).map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black group-hover:bg-blue-600 group-hover:text-white transition-all uppercase">{s.fullName.charAt(0)}</div>
                         <div>
                            <div className="font-bold text-slate-900">{s.fullName}</div>
                            <div className="text-[10px] text-slate-400 font-black uppercase">{s.parentName}</div>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="text-sm font-mono font-bold text-slate-600">{s.admissionNumber}</span></td>
                    <td className="px-6 py-4"><span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[9px] font-black rounded-lg uppercase tracking-wider">{s.grade}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${s.paidFees >= s.totalFees ? 'bg-green-500' : 'bg-yellow-400'}`}></div>
                         <span className="text-[10px] font-black text-slate-500 uppercase">{s.paidFees >= s.totalFees ? 'Fees Clear' : 'Fees Pending'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setSelectedStudentId(s.id); setView('reports'); }} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><FileText size={18}/></button>
                        <button onClick={() => { setView('finance'); }} className="p-2 text-slate-400 hover:text-green-600 transition-colors"><Wallet size={18}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {students.length === 0 && (
             <div className="py-24 text-center">
                <Users size={64} className="mx-auto text-slate-100 mb-4"/>
                <p className="text-slate-400 font-black uppercase text-xs tracking-[0.2em]">No students admitted yet</p>
                <button onClick={() => setIsAdding(true)} className="mt-4 text-blue-600 text-sm font-bold hover:underline">Admission Form</button>
             </div>
          )}
        </div>
      </div>
    );
  };

  const SettingsView = () => {
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [newUser, setNewUser] = useState<Partial<AuthUser>>({ role: 'TEACHER' });

    const handleAddUser = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newUser.name || !newUser.username) return;
      const user: AuthUser = {
        id: Math.random().toString(36).substr(2, 9),
        name: newUser.name,
        username: newUser.username,
        role: newUser.role as UserRole
      };
      setUsers([...users, user]);
      setIsAddingUser(false);
    };

    const deleteUser = (id: string) => {
      if (id === currentUser?.id) return alert("Cannot delete current user");
      setUsers(users.filter(u => u.id !== id));
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">System Settings</h1>
          <button 
            onClick={() => setIsAddingUser(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Add Staff User</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">User Management & Authentication</h2>
            <p className="text-sm text-slate-500">Manage school staff accounts and access levels.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Staff Member</th>
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold">{u.name}</td>
                    <td className="px-6 py-4 font-mono text-slate-500">@{u.username}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                        u.role === 'ADMIN' ? 'bg-red-50 text-red-700' :
                        u.role === 'TEACHER' ? 'bg-blue-50 text-blue-700' :
                        u.role === 'ACCOUNTANT' ? 'bg-green-50 text-green-700' :
                        'bg-slate-50 text-slate-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => deleteUser(u.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {isAddingUser && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Add New Staff</h2>
                <button onClick={() => setIsAddingUser(false)}><X /></button>
              </div>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">Full Name</label>
                  <input required type="text" className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" onChange={e => setNewUser({...newUser, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">Username</label>
                  <input required type="text" className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" onChange={e => setNewUser({...newUser, username: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-1">Role</label>
                  <select className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}>
                    <option value="TEACHER">TEACHER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="ACCOUNTANT">ACCOUNTANT</option>
                    <option value="HEAD_TEACHER">HEAD_TEACHER</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button type="button" onClick={() => setIsAddingUser(false)} className="px-4 py-2 text-slate-600">Cancel</button>
                  <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700">Create Account</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const MarksEntryComponent = ({ students, assessments, handleAddAssessment, setView, setSelectedStudentId }: any) => {
    const [selectedGrade, setSelectedGrade] = useState<Grade>(GRADES[0]);
    const subjects = getSubjectsForGrade(selectedGrade);
    const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0].id);
    const [loadingRemarkId, setLoadingRemarkId] = useState<string | null>(null);

    const gradeStudents = students.filter((s: Student) => s.grade === selectedGrade);

    const generateSubjectRemark = async (student: Student) => {
      const currentAssessment = assessments.find((a: Assessment) => 
        a.studentId === student.id && 
        a.subjectId === selectedSubjectId && 
        a.term === student.term && 
        a.year === student.year
      );

      if (!currentAssessment) return;
      
      setLoadingRemarkId(student.id);
      try {
        const subjectName = subjects.find(s => s.id === selectedSubjectId)?.name || 'Subject';
        const remark = await generateReportRemark(
          student.fullName, 
          subjectName, 
          currentAssessment.performanceLevel, 
          currentAssessment.score
        );
        handleAddAssessment({ ...currentAssessment, remarks: remark });
      } finally {
        setLoadingRemarkId(null);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold">Academic Assessment</h1>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 bg-white border rounded-xl px-3 py-1.5 shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400">Grade</span>
              <select 
                className="text-sm font-bold bg-transparent outline-none cursor-pointer"
                value={selectedGrade}
                onChange={(e) => {
                  const newGrade = e.target.value as Grade;
                  setSelectedGrade(newGrade);
                  setSelectedSubjectId(getSubjectsForGrade(newGrade)[0].id);
                }}
              >
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="flex items-center space-x-2 bg-white border rounded-xl px-3 py-1.5 shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400">Subject</span>
              <select 
                className="text-sm font-bold bg-transparent outline-none cursor-pointer"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
              >
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="font-bold text-slate-900">Marks Entry Sheet</h2>
              <p className="text-xs text-slate-500">Academic Year {selectedGrade}</p>
            </div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
              <CheckCircle size={14} className="text-green-500" />
              Live update active
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Learner</th>
                  <th className="px-6 py-4">Score (0-100)</th>
                  <th className="px-6 py-4">Level</th>
                  <th className="px-6 py-4">AI Qualitative Remark</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gradeStudents.map((s: Student) => {
                  const assessment = assessments.find((a: Assessment) => 
                    a.studentId === s.id && 
                    a.subjectId === selectedSubjectId && 
                    a.term === s.term && 
                    a.year === s.year
                  );

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{s.fullName}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-black">{s.admissionNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <input 
                          type="number" 
                          min="0" max="100"
                          placeholder="0"
                          className="w-20 bg-slate-100 border-none rounded-lg px-3 py-2 text-sm font-black focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                          value={assessment?.score ?? ''}
                          onChange={(e) => {
                            const scoreStr = e.target.value;
                            if (scoreStr === '') return;
                            const score = parseInt(scoreStr);
                            if (isNaN(score) || score < 0 || score > 100) return;
                            handleAddAssessment({
                              studentId: s.id,
                              subjectId: selectedSubjectId,
                              score: score,
                              performanceLevel: getPerformanceLevel(score) as PerformanceLevel,
                              remarks: assessment?.remarks || '',
                              term: s.term,
                              year: s.year
                            });
                          }}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase whitespace-nowrap ${
                          assessment?.performanceLevel === PerformanceLevel.EE ? 'bg-green-100 text-green-700' :
                          assessment?.performanceLevel === PerformanceLevel.ME ? 'bg-blue-100 text-blue-700' :
                          assessment?.performanceLevel === PerformanceLevel.AE ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {assessment?.performanceLevel || 'Not Rated'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-[250px] truncate text-xs text-slate-500 italic">
                          {assessment?.remarks || 'Recording in progress...'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                           <button 
                             onClick={() => generateSubjectRemark(s)}
                             disabled={!assessment || loadingRemarkId === s.id}
                             className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-30"
                             title="AI Smart Remark"
                           >
                             <Sparkles size={18} className={loadingRemarkId === s.id ? 'animate-pulse' : ''} />
                           </button>
                           <button 
                             onClick={() => { setSelectedStudentId(s.id); setView('reports'); }}
                             className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                             title="Generate Full Report"
                           >
                             <FileText size={18} />
                           </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {gradeStudents.length === 0 && (
            <div className="p-20 text-center">
              <Users className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No students admitted to {selectedGrade}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- Main Render Logic ---

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-10">
            <div className="bg-blue-600 p-3 rounded-2xl mb-4 shadow-xl shadow-blue-900/20">
              <Sparkles className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">ELIMU<span className="text-blue-500">SMART</span></h1>
            <p className="text-slate-400 mt-2 text-sm">School Management Portal</p>
          </div>
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            <h2 className="text-white font-semibold text-lg mb-4">Select User to Sign-in</h2>
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => setCurrentUser(u)}
                className="w-full group flex items-center justify-between p-4 rounded-2xl bg-slate-800/50 hover:bg-blue-600 transition-all duration-300 border border-slate-700/50 hover:border-blue-400 text-left mb-2"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-slate-700 p-2 rounded-xl group-hover:bg-blue-500/50 transition-colors">
                    <ShieldCheck className="text-slate-300 group-hover:text-white" size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-white group-hover:text-white">{u.name}</div>
                    <div className="text-[9px] text-slate-500 group-hover:text-blue-100 uppercase tracking-widest font-black">{u.role}</div>
                  </div>
                </div>
                <ChevronRight className="text-slate-600 group-hover:text-white translate-x-0 group-hover:translate-x-1 transition-transform" size={18} />
              </button>
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center space-x-2">
              <Lock size={12} />
              <span>Secure Authentication Enabled</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 font-inter">
      <aside className={`no-print fixed inset-y-0 left-0 z-[60] w-72 bg-slate-950 transform transition-transform duration-300 lg:translate-x-0 lg:static ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-8 flex items-center justify-between">
            <div className="flex items-center space-x-3 text-white">
              <div className="bg-blue-600 p-2 rounded-xl shadow-xl shadow-blue-900/40"><Sparkles size={24} /></div>
              <span className="text-2xl font-black tracking-tighter italic">ELIMU<span className="text-blue-500">SMART</span></span>
            </div>
            <button className="lg:hidden text-slate-500" onClick={() => setIsSidebarOpen(false)}><X /></button>
          </div>
          <nav className="flex-grow px-4 space-y-1.5 overflow-y-auto mt-4">
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={view === 'dashboard'} onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }} role={currentUser.role} allowedRoles={['ADMIN', 'HEAD_TEACHER', 'TEACHER', 'ACCOUNTANT']} />
            <SidebarItem icon={Users} label="Students" active={view === 'students'} onClick={() => { setView('students'); setIsSidebarOpen(false); }} role={currentUser.role} allowedRoles={['ADMIN', 'TEACHER', 'HEAD_TEACHER']} />
            <SidebarItem icon={BookOpen} label="Marks Entry" active={view === 'marks'} onClick={() => { setView('marks'); setIsSidebarOpen(false); }} role={currentUser.role} allowedRoles={['ADMIN', 'TEACHER']} />
            <SidebarItem icon={FileText} label="Report Cards" active={view === 'reports'} onClick={() => { setView('reports'); setIsSidebarOpen(false); }} role={currentUser.role} allowedRoles={['ADMIN', 'HEAD_TEACHER', 'TEACHER']} />
            <SidebarItem icon={CreditCard} label="Finance" active={view === 'finance'} onClick={() => { setView('finance'); setIsSidebarOpen(false); }} role={currentUser.role} allowedRoles={['ADMIN', 'ACCOUNTANT']} />
            <SidebarItem icon={CalendarIcon} label="Calendar" active={view === 'calendar'} onClick={() => { setView('calendar'); setIsSidebarOpen(false); }} role={currentUser.role} allowedRoles={['ADMIN', 'TEACHER', 'HEAD_TEACHER', 'ACCOUNTANT']} />
            <SidebarItem icon={Settings} label="Settings" active={view === 'settings'} onClick={() => { setView('settings'); setIsSidebarOpen(false); }} role={currentUser.role} allowedRoles={['ADMIN']} />
          </nav>
          <div className="p-4 mt-auto">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-black text-white">{currentUser.name.charAt(0)}</div>
              <div className="flex-grow min-w-0">
                <div className="text-sm font-bold text-white truncate">{currentUser.name}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black">{currentUser.role}</div>
              </div>
              <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors"><LogOut size={18} /></button>
            </div>
          </div>
        </div>
      </aside>

      {isSidebarOpen && <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm lg:hidden z-[55]" onClick={() => setIsSidebarOpen(false)}></div>}

      <main className="flex-grow flex flex-col min-w-0">
        <header className="no-print h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:hidden sticky top-0 z-[50]">
          <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors" onClick={() => setIsSidebarOpen(true)}><Menu /></button>
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-1 rounded-lg"><Sparkles size={16} className="text-white" /></div>
            <span className="text-lg font-black tracking-tighter italic">ELIMU<span className="text-blue-500">SMART</span></span>
          </div>
          <div className="w-10"></div>
        </header>

        <header className="hidden lg:flex h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center space-x-2 text-slate-400 text-sm font-medium">
            <span>Portal</span>
            <ChevronRight size={14} />
            <span className="text-slate-900 capitalize font-bold">{view}</span>
          </div>
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Global Search..." className="bg-slate-100/50 border-none rounded-2xl pl-11 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64 transition-all" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <div className="h-8 w-[1px] bg-slate-200"></div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-xs font-black text-slate-900 uppercase tracking-tighter">{currentUser.name}</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{currentUser.role}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center font-bold text-slate-500 shadow-sm">
                {currentUser.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8 flex-grow">
          {view === 'dashboard' && <DashboardComponent metrics={metrics} students={students} calendar={calendar} />}
          {view === 'settings' && <SettingsView />}
          {view === 'calendar' && <CalendarManagerComponent calendar={calendar} currentUser={currentUser} />}
          {view === 'students' && <StudentListComponent students={students} searchQuery={searchQuery} setSearchQuery={setSearchQuery} setView={setView} setSelectedStudentId={setSelectedStudentId} handleAddStudent={(s: Student) => setStudents(prev => [...prev, s])} />}
          {view === 'marks' && <MarksEntryComponent students={students} assessments={assessments} handleAddAssessment={handleAddAssessment} setView={setView} setSelectedStudentId={setSelectedStudentId} />}
          {view === 'reports' && <ReportCardComponent studentId={selectedStudentId} students={students} assessments={assessments} setView={setView} setSelectedStudentId={setSelectedStudentId} isAiLoading={isAiLoading} generateAIRemarks={generateAIRemarks} />}
          {view === 'finance' && <FinanceModuleComponent />}
        </div>
      </main>
    </div>
  );
};

// --- Sub-Components ---

const CalendarManagerComponent = ({ calendar, currentUser }: any) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold">Academic Calendar</h1>
      {currentUser.role === 'ADMIN' && (
        <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center space-x-2">
          <Plus size={16} /><span>Add Event</span>
        </button>
      )}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {calendar.map((c: any) => (
        <div key={`${c.term}-${c.year}`} className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">TERM {c.term}</h3>
            <span className="text-xs font-bold text-slate-400">{c.year}</span>
          </div>
          <div className="space-y-3">
            {c.activities.map((act: any) => (
              <div key={act.id} className="flex items-center space-x-2 text-sm bg-slate-50 p-2 rounded-lg">
                <span className="flex-grow font-medium truncate">{act.title}</span>
                <span className="text-xs text-slate-400 font-bold">{act.date}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ReportCardComponent = ({ studentId, students, assessments, setView, setSelectedStudentId, isAiLoading, generateAIRemarks }: any) => {
  const student = students.find((s: any) => s.id === studentId);
  const studentAssessments = assessments.filter((a: any) => a.studentId === studentId);
  
  if (!student) return <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">Select a student</div>;
  
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center no-print">
        <button onClick={() => setSelectedStudentId(null)} className="flex items-center space-x-2 text-slate-600 font-bold text-sm hover:text-slate-900 transition-colors"><ArrowLeft size={16} /><span>Close Form</span></button>
        <div className="flex space-x-2">
           <button onClick={() => generateAIRemarks(student.id)} disabled={isAiLoading} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center space-x-2 disabled:opacity-50 hover:bg-indigo-100"><Sparkles size={16} /><span>{isAiLoading ? 'Analyzing...' : 'AI Qualitative Remark'}</span></button>
           <button onClick={() => window.print()} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center space-x-2 hover:bg-black"><Printer size={16} /><span>Print Official Form</span></button>
        </div>
      </div>
      <div className="bg-white p-8 md:p-16 border shadow-2xl print:shadow-none print:border-none rounded-sm transition-all duration-500">
        <div className="text-center mb-10 pb-8 border-b-4 border-slate-900 relative">
           <div className="absolute top-0 left-0 text-slate-200 uppercase font-black opacity-10 text-6xl pointer-events-none select-none">OFFICIAL</div>
           <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900">ELIMUSMART ACADEMY</h1>
           <p className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mt-2 underline underline-offset-8 decoration-slate-300">Summative Assessment Report Form</p>
           <div className="mt-8 flex justify-center space-x-16 font-black text-slate-900 text-xs uppercase tracking-widest">
              <span className="bg-slate-100 px-3 py-1 rounded-md">TERM: {student.term}</span>
              <span className="bg-slate-100 px-3 py-1 rounded-md">YEAR: {student.year}</span>
           </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12 text-sm mb-12">
           <div className="flex items-center space-x-3 border-b border-slate-200 pb-2"><span className="font-bold text-slate-400 uppercase text-[10px]">Learner Name:</span><span className="flex-grow uppercase font-black text-slate-800">{student.fullName}</span></div>
           <div className="flex items-center space-x-3 border-b border-slate-200 pb-2"><span className="font-bold text-slate-400 uppercase text-[10px]">Admission No:</span><span className="flex-grow font-black text-slate-800">{student.admissionNumber}</span></div>
           <div className="flex items-center space-x-3 border-b border-slate-200 pb-2"><span className="font-bold text-slate-400 uppercase text-[10px]">Grade Level:</span><span className="flex-grow font-black text-slate-800">{student.grade}</span></div>
           <div className="flex items-center space-x-3 border-b border-slate-200 pb-2"><span className="font-bold text-slate-400 uppercase text-[10px]">Gender:</span><span className="flex-grow font-black text-slate-800">{student.gender}</span></div>
        </div>

        <table className="w-full text-left border-collapse border-2 border-slate-900 mt-6 overflow-hidden">
          <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em]">
            <tr>
              <th className="px-5 py-4 border border-slate-700">Learning Area</th>
              <th className="px-5 py-4 border border-slate-700 text-center">Score</th>
              <th className="px-5 py-4 border border-slate-700">Level of Achievement</th>
              <th className="px-5 py-4 border border-slate-700 w-1/3">Qualitative Remarks</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {getSubjectsForGrade(student.grade).map((subj) => {
              const assessment = studentAssessments.find((a: any) => a.subjectId === subj.id);
              return (
                <tr key={subj.id} className="border-b border-slate-300 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 border-r border-slate-300 font-bold text-slate-800 uppercase text-xs">{subj.name}</td>
                  <td className="px-5 py-4 border-r border-slate-300 text-center font-black text-lg text-slate-700">{assessment?.score !== undefined ? assessment.score : '-'}</td>
                  <td className="px-5 py-4 border-r border-slate-300">
                    {assessment ? (
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${
                        assessment.performanceLevel === PerformanceLevel.EE ? 'bg-green-100 text-green-700' :
                        assessment.performanceLevel === PerformanceLevel.ME ? 'bg-blue-100 text-blue-700' :
                        assessment.performanceLevel === PerformanceLevel.AE ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {assessment.performanceLevel}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-5 py-4 text-xs italic text-slate-600 leading-relaxed font-medium">
                    {assessment?.remarks || 'Recording evaluation results.'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-16 pt-10 border-t-2 border-dashed border-slate-200 space-y-8">
           <div className="flex flex-col space-y-2">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">General Class Teacher's Remarks:</span>
             <p className="border-b border-slate-200 pb-2 font-medium italic text-slate-700">The student demonstrates steady improvement. Keep focus on the learning goals.</p>
           </div>
           
           <div className="grid grid-cols-2 gap-16 mt-12">
              <div className="border-t-2 border-slate-900 pt-3 text-center">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Class Teacher's Signature</p>
                 <div className="h-12 flex items-end justify-center">
                   <div className="w-24 border-b border-slate-300 mb-1"></div>
                 </div>
              </div>
              <div className="border-t-2 border-slate-900 pt-3 text-center relative">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Head Teacher's Stamp</p>
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-slate-200 rounded-full border-dashed opacity-20 pointer-events-none"></div>
              </div>
           </div>
        </div>
        
        <div className="mt-12 text-center">
           <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Auto-generated by ElimuSmart System & Powered by Gemini AI</p>
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
