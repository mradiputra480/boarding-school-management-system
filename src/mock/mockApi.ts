/**
 * Mock API Layer for Static Portfolio Demo
 * 
 * This module intercepts all axios API calls and returns realistic dummy data.
 * No backend server is required — everything runs client-side.
 * 
 * Architecture:
 *   App → axios.get('/api/...') → mockApi.handleRequest() → JSON dummy data
 */

import { mockUsers, type MockUser } from './mockAuth';

// ─── Dummy Data ─────────────────────────────────────────────────────

const schoolProfile = {
  id: 1,
  name: 'Nusantara International Boarding School',
  logo: null,
  logoUrl: null,
  address: 'Jl. Pendidikan No. 45, Sidoarjo, Jawa Timur 61234',
  phone: '(031) 8912345',
  email: 'admin@nibs.sch.id',
  principal_name: 'Dr. Ahmad Fauzi, M.Pd.',
  principal_nip: '197508152003121004',
  principal_signature: null,
  npsn: '20539876',
  accreditation: 'A',
  letterhead: null,
  default_kkm: 75,
  allow_below_kkm: false,
  parent_menu_access: {
    academic: true,
    discipline: true,
    achievements: true,
    assessment_events: true,
    documents: true,
    graduation: true,
    discipline_show_detail: true,
    schedule: true,
  },
  updated_at: '2026-09-01T00:00:00Z',
};

const semesters = [
  { id: 1, name: 'Ganjil 2025/2026', academic_year: '2025/2026', semester: 1, is_active: false, created_at: '2025-07-01' },
  { id: 2, name: 'Genap 2025/2026', academic_year: '2025/2026', semester: 2, is_active: false, created_at: '2026-01-01' },
  { id: 3, name: 'Ganjil 2026/2027', academic_year: '2026/2027', semester: 1, is_active: true, created_at: '2026-07-01' },
];

const teachers = [
  { id: 1, user_id: 2, name: 'Siti Rahmawati, S.Pd.', nip: '198305142010012003', nik: '3515141234560001', photo: null, position: 'Guru Matematika', is_homeroom: true, is_coa: false, is_kedisiplinan: false, is_icc: false, is_humas: false, is_tu: false, is_admin_digiart: false, is_admin_ekstra: false, is_student_report: false, is_curriculum_analytics: false, homeroom_class: { id: 1, name: 'VII-A', level: '7' }, subjects: [{ id: 1, name: 'Mathematics' }], schedules: [] },
  { id: 2, user_id: 3, name: 'Budi Hartono, S.Pd.I.', nip: '198712032011011002', nik: '3515141234560002', photo: null, position: 'Guru PAI', is_homeroom: true, is_coa: false, is_kedisiplinan: true, is_icc: false, is_humas: false, is_tu: false, is_admin_digiart: false, is_admin_ekstra: false, is_student_report: false, is_curriculum_analytics: false, homeroom_class: { id: 2, name: 'VII-B', level: '7' }, subjects: [{ id: 2, name: 'Islamic Studies' }], schedules: [] },
  { id: 3, user_id: 6, name: 'Dewi Puspitasari, S.Pd.', nip: '199001152012012001', nik: '3515141234560003', photo: null, position: 'Guru B. Indonesia', is_homeroom: true, is_coa: true, is_kedisiplinan: false, is_icc: true, is_humas: true, is_tu: false, is_admin_digiart: true, is_admin_ekstra: true, is_student_report: true, is_curriculum_analytics: true, homeroom_class: { id: 3, name: 'VIII-A', level: '8' }, subjects: [{ id: 3, name: 'Indonesian Language' }], schedules: [] },
  { id: 4, user_id: 7, name: 'Hendra Wijaya, S.Si.', nip: '198509182013011001', nik: '3515141234560004', photo: null, position: 'Guru IPA', is_homeroom: false, is_coa: false, is_kedisiplinan: false, is_icc: false, is_humas: false, is_tu: false, is_admin_digiart: false, is_admin_ekstra: false, is_student_report: false, is_curriculum_analytics: false, homeroom_class: null, subjects: [{ id: 4, name: 'Science' }], schedules: [] },
  { id: 5, user_id: 8, name: 'Rina Fitriani, S.Pd.', nip: '199204222014022001', nik: '3515141234560005', photo: null, position: 'Guru B. Inggris', is_homeroom: true, is_coa: false, is_kedisiplinan: false, is_icc: false, is_humas: false, is_tu: false, is_admin_digiart: false, is_admin_ekstra: false, is_student_report: false, is_curriculum_analytics: false, homeroom_class: { id: 4, name: 'VIII-B', level: '8' }, subjects: [{ id: 5, name: 'English' }], schedules: [] },
  { id: 6, user_id: 9, name: 'Agus Setiawan, S.Pd.', nip: '198811072015011001', nik: '3515141234560006', photo: null, position: 'Guru Matematika', is_homeroom: true, is_coa: false, is_kedisiplinan: false, is_icc: false, is_humas: false, is_tu: false, is_admin_digiart: false, is_admin_ekstra: false, is_student_report: false, is_curriculum_analytics: false, homeroom_class: { id: 5, name: 'IX-A', level: '9' }, subjects: [{ id: 1, name: 'Mathematics' }], schedules: [] },
  { id: 7, user_id: 10, name: 'Lestari Handayani, S.Pd.', nip: '199306152016022001', nik: '3515141234560007', photo: null, position: 'Guru IPS', is_homeroom: true, is_coa: false, is_kedisiplinan: false, is_icc: false, is_humas: false, is_tu: false, is_admin_digiart: false, is_admin_ekstra: false, is_student_report: false, is_curriculum_analytics: false, homeroom_class: { id: 6, name: 'IX-B', level: '9' }, subjects: [{ id: 6, name: 'Social Studies' }], schedules: [] },
];

const generateStudents = () => {
  const names = [
    'Aqila Zahra Putri', 'Muhammad Raffi Pratama', 'Nayla Salsabila', 'Ahmad Dzaky Firdaus',
    'Keisha Amelia Rahma', 'Fadhil Arkan Putra', 'Syifa Aulia Ramadhani', 'Raka Aditya Nugraha',
    'Alya Nabilah Safitri', 'Dimas Arya Wicaksono', 'Zahra Putri Andini', 'Farel Akbar Maulana',
    'Cantika Dewi Lestari', 'Rizky Ramadhan Putra', 'Nadia Safira Azzahra', 'Farhan Hakim Pratama',
    'Salma Khairunnisa', 'Gibran Raditya Putra', 'Aisha Nur Fatimah', 'Bayu Aji Saputra',
    'Intan Permata Sari', 'Hafiz Zulfikar Rahman', 'Kayla Indah Pertiwi', 'Arif Dwi Nugroho',
    'Nazwa Aulia Putri', 'Yusuf Ahmad Hidayat', 'Shafira Dewi Anggraeni', 'Rizal Fadillah',
    'Bunga Citra Purnama', 'Galih Satria Perkasa', 'Amira Raissa Putri', 'Daffa Mahardika',
    'Luna Azzahra Kinanti', 'Fikri Adnan Harahap', 'Raisya Nur Aini', 'Ilham Bayu Ramadhan',
  ];
  const classes = [
    { id: 1, name: 'VII-A', level: '7' }, { id: 2, name: 'VII-B', level: '7' },
    { id: 3, name: 'VIII-A', level: '8' }, { id: 4, name: 'VIII-B', level: '8' },
    { id: 5, name: 'IX-A', level: '9' }, { id: 6, name: 'IX-B', level: '9' },
  ];
  return names.map((name, i) => ({
    id: i + 1,
    name,
    nis: `2025${String(i + 1).padStart(4, '0')}`,
    nisn: `00${String(3050000 + i)}`,
    class: classes[i % 6],
    class_id: classes[i % 6].id,
    gender: i % 3 === 0 ? 'L' : 'P',
    photo: null,
    parent_id: i + 1,
    parent_name: `Wali dari ${name.split(' ')[0]}`,
    birth_date: `20${12 + (i % 3)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
    birth_place: ['Surabaya', 'Sidoarjo', 'Malang', 'Gresik', 'Jakarta', 'Bandung'][i % 6],
    address: `Jl. Contoh No. ${i + 1}, Kota Demo`,
    discipline_points: Math.max(60, 100 - (i % 5) * 8),
    is_red_zone: (i % 12 === 0),
  }));
};
const students = generateStudents();

const subjects = [
  { id: 1, name: 'Mathematics', code: 'MTK', type: 'A', kkm: 75, teacher_id: 1, teacher_name: 'Siti Rahmawati, S.Pd.' },
  { id: 2, name: 'Islamic Studies', code: 'PAI', type: 'A', kkm: 75, teacher_id: 2, teacher_name: 'Budi Hartono, S.Pd.I.' },
  { id: 3, name: 'Indonesian Language', code: 'BIN', type: 'A', kkm: 75, teacher_id: 3, teacher_name: 'Dewi Puspitasari, S.Pd.' },
  { id: 4, name: 'Science', code: 'IPA', type: 'A', kkm: 75, teacher_id: 4, teacher_name: 'Hendra Wijaya, S.Si.' },
  { id: 5, name: 'English', code: 'BIG', type: 'A', kkm: 75, teacher_id: 5, teacher_name: 'Rina Fitriani, S.Pd.' },
  { id: 6, name: 'Social Studies', code: 'IPS', type: 'B', kkm: 75, teacher_id: 7, teacher_name: 'Lestari Handayani, S.Pd.' },
  { id: 7, name: 'Physical Education', code: 'PJO', type: 'B', kkm: 75, teacher_id: null, teacher_name: null },
  { id: 8, name: 'Arts & Culture', code: 'SBD', type: 'B', kkm: 75, teacher_id: null, teacher_name: null },
  { id: 9, name: 'Arabic Language', code: 'BRA', type: 'C', kkm: 70, teacher_id: null, teacher_name: null },
  { id: 10, name: 'Tahfidz Al-Quran', code: 'THF', type: 'local', kkm: 70, teacher_id: null, teacher_name: null },
];

const classes = [
  { id: 1, name: 'VII-A', level: '7', homeroom_teacher_id: 1, homeroom_teacher_name: 'Siti Rahmawati, S.Pd.', student_count: 6, graduation_toggle: false },
  { id: 2, name: 'VII-B', level: '7', homeroom_teacher_id: 2, homeroom_teacher_name: 'Budi Hartono, S.Pd.I.', student_count: 6, graduation_toggle: false },
  { id: 3, name: 'VIII-A', level: '8', homeroom_teacher_id: 3, homeroom_teacher_name: 'Dewi Puspitasari, S.Pd.', student_count: 6, graduation_toggle: false },
  { id: 4, name: 'VIII-B', level: '8', homeroom_teacher_id: 5, homeroom_teacher_name: 'Rina Fitriani, S.Pd.', student_count: 6, graduation_toggle: false },
  { id: 5, name: 'IX-A', level: '9', homeroom_teacher_id: 6, homeroom_teacher_name: 'Agus Setiawan, S.Pd.', student_count: 6, graduation_toggle: true },
  { id: 6, name: 'IX-B', level: '9', homeroom_teacher_id: 7, homeroom_teacher_name: 'Lestari Handayani, S.Pd.', student_count: 6, graduation_toggle: true },
];

const positions = [
  { id: 1, name: 'Kepala Sekolah', holder_name: 'Dr. Ahmad Fauzi, M.Pd.' },
  { id: 2, name: 'Wakil Kepala Kurikulum', holder_name: 'Dewi Puspitasari, S.Pd.' },
  { id: 3, name: 'Wakil Kepala Kesiswaan', holder_name: 'Budi Hartono, S.Pd.I.' },
  { id: 4, name: 'Kepala TU', holder_name: 'Eko Prasetyo, S.E.' },
];

const dashboardStats = {
  stats: { total_teachers: 7, total_students: 36, total_classes: 6 },
  active_semester: 'Ganjil 2026/2027',
  submit_tracker: classes.map(c => ({
    class_id: c.id, class_name: c.name, homeroom: c.homeroom_teacher_name,
    total_subjects: 10, submitted_count: Math.floor(Math.random() * 8) + 2, percentage: 0,
    subjects: subjects.map(s => ({ subject_id: s.id, subject_name: s.name, is_submitted: Math.random() > 0.3, submitted_at: Math.random() > 0.3 ? '2026-09-15T10:30:00Z' : null })),
  })).map(t => ({ ...t, percentage: Math.round((t.submitted_count / t.total_subjects) * 100) })),
  recent_events: [
    { id: 1, name: 'Tryout ANBK Tahap 1', description: 'Tryout persiapan ANBK untuk kelas IX', status: 'completed', academic_year: '2026/2027', results_count: 12, created_at: '2026-08-15' },
    { id: 2, name: 'TKA Semester Ganjil', description: 'Tes Kemampuan Agama semester ganjil', status: 'active', academic_year: '2026/2027', results_count: 0, created_at: '2026-09-20' },
  ],
  recent_documents: [
    { id: 1, title: 'Surat Keterangan Lulus 2026', type: 'SKL', status: 'distributed', recipients_count: 12, created_at: '2026-06-15' },
    { id: 2, title: 'Bebas Tanggungan', type: 'Administrative', status: 'draft', recipients_count: 0, created_at: '2026-09-01' },
  ],
};

const schedules = (() => {
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const times = ['07:00-07:40', '07:40-08:20', '08:20-09:00', '09:15-09:55', '09:55-10:35', '10:50-11:30', '11:30-12:10', '13:00-13:40'];
  const result: any[] = [];
  let id = 1;
  for (const cls of classes) {
    for (const day of days) {
      for (let i = 0; i < 6; i++) {
        const subj = subjects[Math.floor(Math.random() * subjects.length)];
        result.push({ id: id++, class_id: cls.id, class_name: cls.name, day, time_slot: times[i], subject_id: subj.id, subject_name: subj.name, teacher_id: subj.teacher_id, teacher_name: subj.teacher_name || 'TBD' });
      }
    }
  }
  return result;
})();

const disciplineRecords = [
  { id: 1, student_id: 1, student_name: 'Aqila Zahra Putri', class_name: 'VII-A', type: 'violation', category: 'Ringan', description: 'Terlambat masuk kelas', points_deducted: 5, status: 'approved', reported_by: 'Budi Hartono, S.Pd.I.', approved_by: 'Budi Hartono, S.Pd.I.', student_confirmed_at: '2026-09-10T07:30:00Z', created_at: '2026-09-10T07:15:00Z' },
  { id: 2, student_id: 3, student_name: 'Nayla Salsabila', class_name: 'VIII-A', type: 'violation', category: 'Sedang', description: 'Tidak mengerjakan PR 3 kali berturut-turut', points_deducted: 10, status: 'approved', reported_by: 'Siti Rahmawati, S.Pd.', approved_by: 'Budi Hartono, S.Pd.I.', student_confirmed_at: '2026-09-12T08:00:00Z', created_at: '2026-09-12T07:45:00Z' },
  { id: 3, student_id: 5, student_name: 'Keisha Amelia Rahma', class_name: 'IX-A', type: 'achievement', category: 'Penghargaan', description: 'Juara 1 Lomba Pidato B. Inggris Tingkat Kabupaten', points_deducted: -15, status: 'approved', reported_by: 'Rina Fitriani, S.Pd.', approved_by: 'Budi Hartono, S.Pd.I.', student_confirmed_at: null, created_at: '2026-09-15T10:00:00Z' },
  { id: 4, student_id: 7, student_name: 'Syifa Aulia Ramadhani', class_name: 'VII-A', type: 'violation', category: 'Ringan', description: 'Seragam tidak lengkap', points_deducted: 3, status: 'pending', reported_by: 'Dewi Puspitasari, S.Pd.', approved_by: null, student_confirmed_at: '2026-09-20T07:10:00Z', created_at: '2026-09-20T07:05:00Z' },
  { id: 5, student_id: 10, student_name: 'Dimas Arya Wicaksono', class_name: 'VIII-B', type: 'violation', category: 'Berat', description: 'Berkelahi dengan teman', points_deducted: 25, status: 'approved', reported_by: 'Budi Hartono, S.Pd.I.', approved_by: 'Budi Hartono, S.Pd.I.', student_confirmed_at: '2026-09-22T09:30:00Z', created_at: '2026-09-22T09:00:00Z' },
];

const achievements = [
  { id: 1, student_id: 5, student_name: 'Keisha Amelia Rahma', class_name: 'IX-A', title: 'Juara 1 Lomba Pidato B. Inggris', level: 'Kabupaten', year: 2026, proof_link: 'https://drive.google.com/example1', created_at: '2026-09-15' },
  { id: 2, student_id: 2, student_name: 'Muhammad Raffi Pratama', class_name: 'VII-B', title: 'Juara 2 Olimpiade Matematika', level: 'Provinsi', year: 2026, proof_link: 'https://drive.google.com/example2', created_at: '2026-08-20' },
  { id: 3, student_id: 14, student_name: 'Rizky Ramadhan Putra', class_name: 'VIII-B', title: 'Juara 3 MTQ Tingkat Kecamatan', level: 'Kecamatan', year: 2026, proof_link: 'https://drive.google.com/example3', created_at: '2026-07-10' },
  { id: 4, student_id: 9, student_name: 'Alya Nabilah Safitri', class_name: 'IX-A', title: 'Best Delegate MUN 2026', level: 'Nasional', year: 2026, proof_link: 'https://drive.google.com/example4', created_at: '2026-06-05' },
];

const events = [
  { id: 1, title: 'Milad Pesantren ke-15', description: 'Perayaan hari lahir pesantren dengan berbagai lomba dan pentas seni', date: '2026-10-15', status: 'upcoming', photo_url: null, created_by: 'Dewi Puspitasari, S.Pd.', created_at: '2026-09-20' },
  { id: 2, title: 'Ujian Tengah Semester Ganjil', description: 'UTS Ganjil TA 2026/2027 untuk seluruh jenjang', date: '2026-10-07', status: 'upcoming', photo_url: null, created_by: 'Admin', created_at: '2026-09-01' },
  { id: 3, title: 'Peringatan Maulid Nabi SAW', description: 'Kegiatan Maulid Nabi Muhammad SAW', date: '2026-09-27', status: 'completed', photo_url: null, created_by: 'Dewi Puspitasari, S.Pd.', created_at: '2026-09-15' },
];

const leaderboardData = {
  top_students: students.slice(0, 10).map((s, i) => ({ ...s, rank: i + 1, average_score: 95 - i * 2.5, attendance_rate: 100 - i })),
  top_teachers: teachers.slice(0, 5).map((t, i) => ({ ...t, rank: i + 1, submission_rate: 100 - i * 5, classes_count: 3 - (i % 2) })),
  class_ranking: classes.map((c, i) => ({ ...c, rank: i + 1, average_score: 88 - i * 3, discipline_avg: 95 - i * 2 })),
};

const accounts = [
  { id: 1, username: 'admin', name: 'Administrator', role: 'admin', last_login: '2026-10-01T08:00:00Z' },
  ...teachers.map((t, i) => ({ id: t.user_id, username: `teacher${i + 1}`, name: t.name, role: 'teacher', last_login: '2026-09-30T07:00:00Z' })),
  ...students.slice(0, 6).map((s, i) => ({ id: 20 + i, username: `parent${i + 1}`, name: s.parent_name, role: 'parent', last_login: '2026-09-28T19:00:00Z' })),
  { id: 30, username: 'tu1', name: 'Eko Prasetyo, S.E.', role: 'tu', last_login: '2026-09-29T08:00:00Z' },
];

const parentStudentData = {
  student: students[4], // Keisha Amelia Rahma (IX-A)
  grades: subjects.map(s => ({
    subject_id: s.id, subject_name: s.name, kkm: s.kkm,
    score: Math.floor(Math.random() * 20) + 75,
    percentage: Math.floor(Math.random() * 30) + 70,
    grade: ['A', 'A-', 'B+', 'B'][Math.floor(Math.random() * 4)],
  })),
  discipline: { current_points: 92, total_violations: 1, total_achievements: 2, records: disciplineRecords.filter(d => d.student_id === 5) },
  achievements: achievements.filter(a => a.student_id === 5),
};

const healthData = {
  status: 'healthy' as const,
  response_ms: 45,
  speed_rating: 'A',
  environment: {
    type: 'production',
    cache_driver: 'file',
    queue_driver: 'sync',
    exec_available: true,
    php_version: '8.5.0',
    php_compatible: true,
  },
  services: {
    database: { ok: true, ms: 12 },
    cache: { ok: true, ms: 2, driver: 'file' },
    queue: { driver: 'sync', status: 'running', workers: 1 },
    opcache: { enabled: true, scripts: 1543, hit_rate: 98.5, memory_used_mb: 64.2 },
  },
  resources: {
    disk_used_pct: 45.2,
    disk_free_gb: 54.8,
    storage_mb: 1024,
    php_memory_mb: 128,
    php_memory_limit_mb: 512,
  },
  backup: { last: '2026-10-04T02:00:00Z', count: 5, days_since: 1, status: 'ok', total_size_mb: 250 },
  alerts: [],
  timestamp: new Date().toISOString(),
};

const waBlastHistory = [
  { id: 1, message: 'Assalamualaikum, menginformasikan bahwa UTS Ganjil akan dilaksanakan mulai 7 Oktober 2026.', recipients_count: 36, status: 'sent', sent_at: '2026-09-25T10:00:00Z' },
  { id: 2, message: 'Reminder: Pembayaran SPP bulan Oktober paling lambat tanggal 10 Oktober 2026.', recipients_count: 36, status: 'sent', sent_at: '2026-09-28T08:00:00Z' },
];

const assessmentEvents = [
  { id: 1, name: 'Tryout ANBK Tahap 1', description: 'Tryout persiapan ANBK Numerasi & Literasi', academic_year: '2026/2027', status: 'completed', type: 'ANBK', target_classes: ['IX-A', 'IX-B'], results_count: 12, certificates_count: 12, created_at: '2026-08-15' },
  { id: 2, name: 'TKA Semester Ganjil', description: 'Tes Kemampuan Agama semester ganjil', academic_year: '2026/2027', status: 'active', type: 'TKA', target_classes: ['VII-A', 'VII-B', 'VIII-A', 'VIII-B', 'IX-A', 'IX-B'], results_count: 0, certificates_count: 0, created_at: '2026-09-20' },
];

const documents = [
  { id: 1, title: 'Surat Keterangan Lulus (SKL) 2026', type: 'SKL', description: 'SKL untuk siswa kelas IX TA 2025/2026', target_level: '9', status: 'distributed', recipients_count: 12, file_count: 12, created_at: '2026-06-15' },
  { id: 2, title: 'Surat Bebas Tanggungan', type: 'Administrative', description: 'Surat keterangan bebas tanggungan keuangan', target_level: '9', status: 'draft', recipients_count: 0, file_count: 0, created_at: '2026-09-01' },
];

const activityGroups = [
  { id: 1, name: 'Robotics Club', type: 'ekstra', teacher_id: 4, teacher_name: 'Hendra Wijaya, S.Si.', student_count: 15, day: 'Rabu', time: '15:00-16:30' },
  { id: 2, name: 'Digital Art Studio', type: 'digiart', teacher_id: 3, teacher_name: 'Dewi Puspitasari, S.Pd.', student_count: 12, day: 'Kamis', time: '15:00-16:30' },
  { id: 3, name: 'Futsal', type: 'ekstra', teacher_id: null, teacher_name: 'Coach Ahmad', student_count: 20, day: 'Selasa', time: '15:00-16:30' },
  { id: 4, name: 'Tilawah Al-Quran', type: 'ekstra', teacher_id: 2, teacher_name: 'Budi Hartono, S.Pd.I.', student_count: 18, day: 'Jumat', time: '14:00-15:30' },
];

const masterActivities = [
  { id: 1, name: 'Robotics', type: 'ekstra', is_active: true },
  { id: 2, name: 'Digital Art', type: 'digiart', is_active: true },
  { id: 3, name: 'Futsal', type: 'ekstra', is_active: true },
  { id: 4, name: 'Tilawah', type: 'ekstra', is_active: true },
  { id: 5, name: 'Graphic Design', type: 'digiart', is_active: true },
];

const graduationData = {
  is_eligible: true,
  student_name: 'Keisha Amelia Rahma',
  class_name: 'IX-A',
  nis: '20250005',
  nisn: '003050004',
  homeroom_message: 'Selamat atas kelulusannya! Teruslah berprestasi dan jadilah kebanggaan keluarga dan bangsa. Semoga sukses di jenjang pendidikan selanjutnya.',
  homeroom_teacher: 'Agus Setiawan, S.Pd.',
  principal_name: 'Dr. Ahmad Fauzi, M.Pd.',
  graduation_year: '2026',
};

// ─── Current User Context (set by login) ────────────────────────────

let currentUser: MockUser | null = null;

export function setCurrentUser(user: MockUser | null) {
  currentUser = user;
}

// ─── Route Matching & Response ──────────────────────────────────────

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

interface MockRoute {
  method: Method;
  pattern: RegExp | string;
  handler: (url: string, data?: any) => any;
}

const routes: MockRoute[] = [
  // ─── Public / Auth ─────────────────────────────────────────────
  { method: 'get', pattern: /\/public\/school-profile/, handler: () => ({ data: schoolProfile }) },
  { method: 'get', pattern: /\/admin\/school-profile/, handler: () => ({ data: schoolProfile }) },

  // ─── Admin Dashboard ───────────────────────────────────────────
  { method: 'get', pattern: /\/admin\/dashboard$/, handler: () => dashboardStats },
  { method: 'get', pattern: /\/admin\/system-health/, handler: () => ({ data: healthData }) },
  { method: 'get', pattern: /\/admin\/leaderboard/, handler: () => ({ data: leaderboardData }) },

  // ─── Admin CRUD ────────────────────────────────────────────────
  { method: 'get', pattern: /\/admin\/teachers$/, handler: () => ({ data: teachers }) },
  { method: 'get', pattern: /\/admin\/teachers\/\d+/, handler: (url) => {
    const id = parseInt(url.split('/').pop()!);
    return { data: teachers.find(t => t.id === id) || teachers[0] };
  }},
  { method: 'get', pattern: /\/admin\/students$/, handler: () => ({ data: students }) },
  { method: 'get', pattern: /\/admin\/students\/\d+/, handler: (url) => {
    const id = parseInt(url.split('/').pop()!);
    return { data: students.find(s => s.id === id) || students[0] };
  }},
  { method: 'get', pattern: /\/admin\/parents$/, handler: () => ({ data: students.map(s => ({ id: s.parent_id, name: s.parent_name, phone: '08123456' + String(s.id).padStart(4, '0'), student_name: s.name, student_class: s.class?.name, username: `parent${s.id}` })) }) },
  { method: 'get', pattern: /\/admin\/classes$/, handler: () => ({ data: classes }) },
  { method: 'get', pattern: /\/admin\/classes\/\d+/, handler: (url) => {
    const id = parseInt(url.split('/').pop()!);
    const cls = classes.find(c => c.id === id) || classes[0];
    return { data: { ...cls, students: students.filter(s => s.class_id === cls.id) } };
  }},
  { method: 'get', pattern: /\/admin\/subjects$/, handler: () => ({ data: subjects }) },
  { method: 'get', pattern: /\/admin\/semesters$/, handler: () => ({ data: semesters }) },
  { method: 'get', pattern: /\/admin\/positions$/, handler: () => ({ data: positions }) },
  { method: 'get', pattern: /\/admin\/accounts$/, handler: () => ({ data: accounts }) },
  { method: 'get', pattern: /\/admin\/schedules$/, handler: () => ({ data: schedules }) },
  { method: 'get', pattern: /\/admin\/events$/, handler: () => ({ data: events }) },
  { method: 'get', pattern: /\/admin\/wa-blast/, handler: () => ({ data: waBlastHistory }) },
  { method: 'get', pattern: /\/admin\/assessment-events/, handler: () => ({ data: assessmentEvents }) },
  { method: 'get', pattern: /\/admin\/documents/, handler: () => ({ data: documents }) },
  { method: 'get', pattern: /\/admin\/master-activities/, handler: () => ({ data: masterActivities }) },
  { method: 'get', pattern: /\/admin\/curriculum-analytics/, handler: () => ({
    data: classes.map(c => ({
      class_id: c.id, class_name: c.name, homeroom: c.homeroom_teacher_name,
      average_score: Math.round(75 + Math.random() * 15),
      at_risk_count: Math.floor(Math.random() * 3),
      discipline_avg: Math.round(85 + Math.random() * 10),
      subjects: subjects.map(s => ({ ...s, class_average: Math.round(70 + Math.random() * 20) })),
    })),
  })},

  // System pages
  { method: 'get', pattern: /\/admin\/system\/backup/, handler: () => ({ data: { backups: [{ filename: 'backup_2026-10-04.sql.gz', size: '12.5 MB', created_at: '2026-10-04T02:00:00Z' }], auto_backup: true } }) },
  { method: 'get', pattern: /\/admin\/export/, handler: () => ({ data: { available_exports: ['Academic Report', 'Student Data', 'Teacher Data', 'Discipline Records'] } }) },

  // ─── Teacher Portal ────────────────────────────────────────────
  { method: 'get', pattern: /\/teacher\/profile/, handler: () => {
    if (!currentUser) return { data: teachers[0] };
    const t = teachers.find(t => t.user_id === currentUser!.id);
    return { data: t || { ...teachers[0], is_kedisiplinan: currentUser!.role === 'teacher', homeroom_class: teachers[0].homeroom_class } };
  }},
  { method: 'get', pattern: /\/teacher\/dashboard/, handler: () => ({
    data: { classes_count: 3, students_count: 18, pending_tasks: 2, schedules: schedules.slice(0, 6) },
  })},
  { method: 'get', pattern: /\/teacher\/schedule/, handler: () => ({ data: schedules.filter(s => s.teacher_id === (currentUser?.id === 3 ? 2 : 1)).slice(0, 30) }) },
  { method: 'get', pattern: /\/teacher\/homeroom/, handler: () => ({
    data: {
      class: classes[0],
      students: students.filter(s => s.class_id === 1).map(s => ({
        ...s, grades: subjects.map(sub => ({ subject_name: sub.name, score: Math.round(70 + Math.random() * 25), percentage: Math.round(70 + Math.random() * 30) })),
        discipline_points: s.discipline_points,
        attendance: { hadir: 45, sakit: 2, izin: 1, alpha: 0 },
      })),
    },
  })},
  { method: 'get', pattern: /\/teacher\/discipline/, handler: () => ({ data: { records: disciplineRecords, summary: { total: 5, approved: 3, pending: 1, rejected: 0, cancelled: 1 } } }) },
  { method: 'get', pattern: /\/teacher\/academic/, handler: () => ({ data: { classes: classes.slice(0, 3), subjects: subjects.slice(0, 5) } }) },
  { method: 'get', pattern: /\/teacher\/student-progress/, handler: () => ({ data: { student: students[0], progress: subjects.map(s => ({ subject: s.name, score: Math.round(70 + Math.random() * 25) })) } }) },
  { method: 'get', pattern: /\/teacher\/icc/, handler: () => ({ data: achievements }) },
  { method: 'get', pattern: /\/teacher\/humas/, handler: () => ({ data: events }) },
  { method: 'get', pattern: /\/teacher\/curriculum-analytics/, handler: () => ({
    data: classes.slice(0, 2).map(c => ({
      class_id: c.id, class_name: c.name, average_score: Math.round(78 + Math.random() * 12),
      subjects: subjects.map(s => ({ ...s, class_average: Math.round(72 + Math.random() * 18) })),
    })),
  })},

  // Activity / Instructor
  { method: 'get', pattern: /\/teacher\/(digiart|ekstra)\/groups/, handler: () => ({ data: activityGroups }) },
  { method: 'get', pattern: /\/teacher\/(digiart|ekstra)\/assessments/, handler: () => ({ data: [] }) },
  { method: 'get', pattern: /\/teacher\/(digiart|ekstra)\/recap/, handler: () => ({ data: [] }) },
  { method: 'get', pattern: /\/teacher\/instructor/, handler: () => ({ data: { groups: activityGroups.slice(0, 2), attendance: [] } }) },
  { method: 'get', pattern: /\/teacher\/homeroom\/activities/, handler: () => ({ data: { activities: activityGroups, grades: [] } }) },
  { method: 'get', pattern: /\/teacher\/documents/, handler: () => ({ data: documents }) },
  { method: 'get', pattern: /\/teacher\/student-report/, handler: () => ({ data: { students: students.slice(0, 6) } }) },

  // ─── Parent Portal ─────────────────────────────────────────────
  { method: 'get', pattern: /\/parent\/dashboard/, handler: () => ({
    data: {
      student: parentStudentData.student,
      notifications: [
        { id: 1, message: 'UTS Ganjil dimulai 7 Oktober 2026', type: 'info', date: '2026-09-25' },
        { id: 2, message: 'Pembayaran SPP Oktober: Lunas ✓', type: 'success', date: '2026-10-01' },
      ],
      calendar: events,
      graduation: graduationData,
    },
  })},
  { method: 'get', pattern: /\/parent\/report-card/, handler: () => ({ data: parentStudentData.grades }) },
  { method: 'get', pattern: /\/parent\/discipline/, handler: () => ({ data: parentStudentData.discipline }) },
  { method: 'get', pattern: /\/parent\/achievements/, handler: () => ({ data: parentStudentData.achievements }) },
  { method: 'get', pattern: /\/parent\/graduation/, handler: () => ({ data: graduationData }) },
  { method: 'get', pattern: /\/parent\/assessment-events/, handler: () => ({ data: assessmentEvents.map(e => ({ ...e, student_score: Math.round(70 + Math.random() * 25), certificate_url: '#' })) }) },
  { method: 'get', pattern: /\/parent\/documents/, handler: () => ({ data: documents.filter(d => d.status === 'distributed').map(d => ({ ...d, download_url: '#' })) }) },
  { method: 'get', pattern: /\/parent\/schedule/, handler: () => ({ data: schedules.filter(s => s.class_id === 5).slice(0, 30) }) },

  // ─── TU Portal ─────────────────────────────────────────────────
  { method: 'get', pattern: /\/tu\/dashboard/, handler: () => ({ data: { documents_count: documents.length, pending_count: 1, recent_documents: documents } }) },
  { method: 'get', pattern: /\/tu\/documents/, handler: () => ({ data: documents }) },
];

// ─── Mock Response Builder ──────────────────────────────────────────

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function handleRequest(method: Method, url: string, data?: any): Promise<any> {
  // Simulate network delay (50-200ms)
  await delay(50 + Math.random() * 150);

  // Clean URL: remove baseURL prefix if present
  const cleanUrl = url.replace(/^\/api/, '');

  // Find matching route
  for (const route of routes) {
    if (route.method !== method) continue;
    if (typeof route.pattern === 'string') {
      if (cleanUrl === route.pattern) return route.handler(cleanUrl, data);
    } else {
      if (route.pattern.test(cleanUrl)) return route.handler(cleanUrl, data);
    }
  }

  // ─── Write Operations (POST/PUT/PATCH/DELETE) → Always succeed ──
  if (method !== 'get') {
    await delay(200);
    return { message: '✅ Operation successful (Demo Mode)', data: data || {} };
  }

  // ─── Fallback for unmatched GET routes ─────────────────────────
  console.warn(`[MockAPI] No handler for ${method.toUpperCase()} ${cleanUrl}`);
  return { data: [], message: 'Demo mode — no data available for this endpoint' };
}
