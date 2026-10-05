import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuthStore } from './stores/authStore';
import LoadingSpinner from './components/LoadingSpinner';

// ─── Lazy-loaded Pages (Code Splitting) ─────────────────────────────
// Each page is loaded on-demand, reducing initial bundle size by ~70%

// Auth
const LoginPage = lazy(() => import('./features/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./features/auth/ForgotPasswordPage'));
const UnauthorizedPage = lazy(() => import('./features/auth/UnauthorizedPage'));

// Admin
const AdminDashboardPage = lazy(() => import('./features/admin/AdminDashboardPage'));
const AdminLeaderboardPage = lazy(() => import('./features/admin/AdminLeaderboardPage'));
const SemesterPage = lazy(() => import('./features/admin/SemesterPage'));
const TeacherPage = lazy(() => import('./features/admin/TeacherPage'));
const StudentPage = lazy(() => import('./features/admin/StudentPage'));
const ParentDataPage = lazy(() => import('./features/admin/ParentDataPage'));
const AccountPage = lazy(() => import('./features/admin/AccountPage'));
const SchoolProfilePage = lazy(() => import('./features/admin/SchoolProfilePage'));
const SubjectPage = lazy(() => import('./features/admin/SubjectPage'));
const PositionPage = lazy(() => import('./features/admin/PositionPage'));
const ClassPage = lazy(() => import('./features/admin/ClassPage'));
const ClassDetailPage = lazy(() => import('./features/admin/ClassDetailPage'));
const CurriculumAnalyticsPage = lazy(() => import('./features/admin/CurriculumAnalyticsPage'));
const MasterActivityPage = lazy(() => import('./features/admin/MasterActivityPage'));
const SchedulePage = lazy(() => import('./features/admin/SchedulePage'));
const WaBlastPage = lazy(() => import('./features/admin/WaBlastPage'));
const BackupPage = lazy(() => import('./features/admin/BackupPage'));
const ExportPage = lazy(() => import('./features/admin/ExportPage'));
const PromotionPage = lazy(() => import('./features/admin/PromotionPage'));
const UpdatePage = lazy(() => import('./features/admin/UpdatePage'));
const MaintenancePage = lazy(() => import('./features/admin/MaintenancePage'));
const AdminEventPage = lazy(() => import('./features/admin/events/AdminEventPage'));
const AssessmentEventPage = lazy(() => import('./features/admin/AssessmentEventPage'));
const DocumentDistributionPage = lazy(() => import('./features/admin/DocumentDistributionPage'));


// TU
const TuDashboardPage = lazy(() => import('./features/tu/TuDashboardPage'));

// Teacher
const TeacherDashboardPage = lazy(() => import('./features/teacher/TeacherDashboardPage'));
const HomeroomPage = lazy(() => import('./features/teacher/HomeroomPage'));
const TeacherStudentProgressPage = lazy(() => import('./features/teacher/TeacherStudentProgressPage'));
const AcademicPage = lazy(() => import('./features/teacher/AcademicPage'));
const TeacherDisciplinePage = lazy(() => import('./features/teacher/TeacherDisciplinePage'));
const StudentReportPage = lazy(() => import('./features/teacher/StudentReportPage'));
const TeacherCurriculumAnalyticsPage = lazy(() => import('./features/teacher/TeacherCurriculumAnalyticsPage'));
const TeacherIccPage = lazy(() => import('./features/icc/TeacherIccPage'));
const TeacherHumasPage = lazy(() => import('./features/humas/TeacherHumasPage'));
const TeacherSchedulePage = lazy(() => import('./features/teacher/TeacherSchedulePage'));
const ActivityGroupPage = lazy(() => import('./features/teacher/activity/ActivityGroupPage'));
const ActivityAssessmentPage = lazy(() => import('./features/teacher/activity/ActivityAssessmentPage'));
const ActivityAdminRecapPage = lazy(() => import('./features/teacher/activity/ActivityAdminRecapPage'));
const InstructorAttendancePage = lazy(() => import('./features/teacher/instructor/InstructorAttendancePage'));
const InstructorGradingPage = lazy(() => import('./features/teacher/instructor/InstructorGradingPage'));
const HomeroomActivityPage = lazy(() => import('./features/teacher/homeroom/HomeroomActivityPage'));

// Parent
const ParentDashboard = lazy(() => import('./features/parent/ParentDashboard'));
const ParentReportCard = lazy(() => import('./features/parent/ParentReportCard'));
const ParentDiscipline = lazy(() => import('./features/parent/ParentDiscipline'));
const ParentAchievement = lazy(() => import('./features/parent/ParentAchievement'));
const ParentGraduation = lazy(() => import('./features/parent/ParentGraduation'));
const ParentAssessmentEvents = lazy(() => import('./features/parent/ParentAssessmentEvents'));
const ParentDocuments = lazy(() => import('./features/parent/ParentDocuments'));

// ─── Protected Route Guard ──────────────────────────────────────────
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  
  return children;
}

// ─── Main App ───────────────────────────────────────────────────────
function App() {
  return (
    <HashRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="/admin/leaderboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminLeaderboardPage /></ProtectedRoute>} />
          <Route path="/admin/semesters" element={<ProtectedRoute allowedRoles={['admin']}><SemesterPage /></ProtectedRoute>} />
          <Route path="/admin/teachers" element={<ProtectedRoute allowedRoles={['admin']}><TeacherPage /></ProtectedRoute>} />
          <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['admin']}><StudentPage /></ProtectedRoute>} />
          <Route path="/admin/parents" element={<ProtectedRoute allowedRoles={['admin']}><ParentDataPage /></ProtectedRoute>} />
          <Route path="/admin/accounts" element={<ProtectedRoute allowedRoles={['admin']}><AccountPage /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><SchoolProfilePage /></ProtectedRoute>} />
          <Route path="/admin/subjects" element={<ProtectedRoute allowedRoles={['admin']}><SubjectPage /></ProtectedRoute>} />
          <Route path="/admin/positions" element={<ProtectedRoute allowedRoles={['admin']}><PositionPage /></ProtectedRoute>} />
          <Route path="/admin/classes" element={<ProtectedRoute allowedRoles={['admin']}><ClassPage /></ProtectedRoute>} />
          <Route path="/admin/classes/:id" element={<ProtectedRoute allowedRoles={['admin']}><ClassDetailPage /></ProtectedRoute>} />
          <Route path="/admin/curriculum-analytics" element={<ProtectedRoute allowedRoles={['admin']}><CurriculumAnalyticsPage /></ProtectedRoute>} />
          <Route path="/admin/master-activities" element={<ProtectedRoute allowedRoles={['admin']}><MasterActivityPage /></ProtectedRoute>} />
          <Route path="/admin/student-progress/:id" element={<ProtectedRoute allowedRoles={['admin']}><TeacherStudentProgressPage /></ProtectedRoute>} />
          <Route path="/admin/schedules" element={<ProtectedRoute allowedRoles={['admin']}><SchedulePage /></ProtectedRoute>} />
          <Route path="/admin/wa-blast" element={<ProtectedRoute allowedRoles={['admin']}><WaBlastPage /></ProtectedRoute>} />
          <Route path="/admin/system/backup" element={<ProtectedRoute allowedRoles={['admin']}><BackupPage /></ProtectedRoute>} />
          <Route path="/admin/system/export" element={<ProtectedRoute allowedRoles={['admin']}><ExportPage /></ProtectedRoute>} />
          <Route path="/admin/system/promotion" element={<ProtectedRoute allowedRoles={['admin']}><PromotionPage /></ProtectedRoute>} />
          <Route path="/admin/system/update" element={<ProtectedRoute allowedRoles={['admin']}><UpdatePage /></ProtectedRoute>} />
          <Route path="/admin/system/maintenance" element={<ProtectedRoute allowedRoles={['admin']}><MaintenancePage /></ProtectedRoute>} />
          <Route path="/admin/events" element={<ProtectedRoute allowedRoles={['admin']}><AdminEventPage /></ProtectedRoute>} />
          <Route path="/admin/assessment-events" element={<ProtectedRoute allowedRoles={['admin']}><AssessmentEventPage /></ProtectedRoute>} />
          <Route path="/admin/documents" element={<ProtectedRoute allowedRoles={['admin']}><DocumentDistributionPage /></ProtectedRoute>} />

          
          {/* TU Routes */}
          <Route path="/tu/dashboard" element={<ProtectedRoute allowedRoles={['tu']}><TuDashboardPage /></ProtectedRoute>} />
          <Route path="/tu/documents" element={<ProtectedRoute allowedRoles={['tu']}><DocumentDistributionPage /></ProtectedRoute>} />
          
          {/* Teacher Routes */}
          <Route path="/teacher/dashboard" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherDashboardPage /></ProtectedRoute>} />
          <Route path="/teacher/schedule" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherSchedulePage /></ProtectedRoute>} />
          <Route path="/teacher/homeroom" element={<ProtectedRoute allowedRoles={['teacher']}><HomeroomPage /></ProtectedRoute>} />
          <Route path="/teacher/student-progress/:id" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherStudentProgressPage /></ProtectedRoute>} />
          <Route path="/teacher/academic" element={<ProtectedRoute allowedRoles={['teacher']}><AcademicPage /></ProtectedRoute>} />
          <Route path="/teacher/discipline" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherDisciplinePage /></ProtectedRoute>} />
          <Route path="/teacher/student-report" element={<ProtectedRoute allowedRoles={['teacher']}><StudentReportPage /></ProtectedRoute>} />
          <Route path="/teacher/curriculum-analytics" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherCurriculumAnalyticsPage /></ProtectedRoute>} />
          <Route path="/teacher/icc" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherIccPage /></ProtectedRoute>} />
          <Route path="/teacher/humas" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherHumasPage /></ProtectedRoute>} />
          <Route path="/teacher/documents" element={<ProtectedRoute allowedRoles={['teacher']}><DocumentDistributionPage /></ProtectedRoute>} />
          <Route path="/teacher/homeroom/activities" element={<ProtectedRoute allowedRoles={['teacher']}><HomeroomActivityPage /></ProtectedRoute>} />
          <Route path="/teacher/digiart/groups" element={<ProtectedRoute allowedRoles={['teacher']}><ActivityGroupPage type="digiart" /></ProtectedRoute>} />
          <Route path="/teacher/digiart/assessments" element={<ProtectedRoute allowedRoles={['teacher']}><ActivityAssessmentPage type="digiart" /></ProtectedRoute>} />
          <Route path="/teacher/digiart/recap" element={<ProtectedRoute allowedRoles={['teacher']}><ActivityAdminRecapPage /></ProtectedRoute>} />
          <Route path="/teacher/ekstra/groups" element={<ProtectedRoute allowedRoles={['teacher']}><ActivityGroupPage type="ekstra" /></ProtectedRoute>} />
          <Route path="/teacher/ekstra/assessments" element={<ProtectedRoute allowedRoles={['teacher']}><ActivityAssessmentPage type="ekstra" /></ProtectedRoute>} />
          <Route path="/teacher/ekstra/recap" element={<ProtectedRoute allowedRoles={['teacher']}><ActivityAdminRecapPage /></ProtectedRoute>} />
          <Route path="/teacher/instructor/digiart" element={<Navigate to="/teacher/instructor/digiart/attendance" replace />} />
          <Route path="/teacher/instructor/digiart/attendance" element={<ProtectedRoute allowedRoles={['teacher']}><InstructorAttendancePage type="digiart" /></ProtectedRoute>} />
          <Route path="/teacher/instructor/digiart/grading" element={<ProtectedRoute allowedRoles={['teacher']}><InstructorGradingPage type="digiart" /></ProtectedRoute>} />
          <Route path="/teacher/instructor/ekstra" element={<Navigate to="/teacher/instructor/ekstra/attendance" replace />} />
          <Route path="/teacher/instructor/ekstra/attendance" element={<ProtectedRoute allowedRoles={['teacher']}><InstructorAttendancePage type="ekstra" /></ProtectedRoute>} />
          <Route path="/teacher/instructor/ekstra/grading" element={<ProtectedRoute allowedRoles={['teacher']}><InstructorGradingPage type="ekstra" /></ProtectedRoute>} />


          {/* Parent Routes */}
          <Route path="/parent/dashboard" element={<ProtectedRoute allowedRoles={['parent']}><ParentDashboard /></ProtectedRoute>} />
          <Route path="/parent/report-card" element={<ProtectedRoute allowedRoles={['parent']}><ParentReportCard /></ProtectedRoute>} />
          <Route path="/parent/discipline" element={<ProtectedRoute allowedRoles={['parent']}><ParentDiscipline /></ProtectedRoute>} />
          <Route path="/parent/achievements" element={<ProtectedRoute allowedRoles={['parent']}><ParentAchievement /></ProtectedRoute>} />
          <Route path="/parent/graduation" element={<ProtectedRoute allowedRoles={['parent']}><ParentGraduation /></ProtectedRoute>} />
          <Route path="/parent/assessment-events" element={<ProtectedRoute allowedRoles={['parent']}><ParentAssessmentEvents /></ProtectedRoute>} />
          <Route path="/parent/documents" element={<ProtectedRoute allowedRoles={['parent']}><ParentDocuments /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}

export default App;
