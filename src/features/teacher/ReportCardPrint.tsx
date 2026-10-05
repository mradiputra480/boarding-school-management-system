import React from 'react';
import { useLangStore } from '@/stores/langStore';

interface StudentGrade {
  subject_id: number;
  subject_name: string;
  group: 'A' | 'B' | 'C';
  kkm: number;
  column_types: string[];
  na_values: (number | null)[];
  average: number | null;
  completion_percentage?: number;
}

interface ActivityReport {
  group_name: string;
  type: string;
  attendance_percentage: number;
  grade: string | null;
  portfolio_link: string | null;
}

interface StudentReport {
  student: {
    id: number;
    name: string;
    nis: string;
    nisn: string;
    gender: string;
    photo: string | null;
  };
  grades: StudentGrade[];
  discipline: { score: number } | null;
  achievements?: any[];
  activities?: ActivityReport[];
  attendance: { H: number; S: number; I: number; A: number };
  homeroom_note: string | null;
}

interface SchoolProfile {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo: string | null;
  letterhead: string | null;
  principal_name: string | null;
  principal_nip: string | null;
  principal_signature: string | null;
}

interface ReportCardPrintProps {
  students: StudentReport[];
  schoolProfile: SchoolProfile | null;
  className: string;
  classLevel: string;
  semesterName: string;
  semesterYear: string;
  teacherName: string;
  teacherNip: string | null;
  teacherSignature: string | null;
  releaseDate: string;
}

import { storageUrl } from '@/lib/storage';
import { QRCodeCanvas } from 'qrcode.react';

export default function ReportCardPrint({
  students,
  schoolProfile,
  className: classNameStr,
  classLevel,
  semesterName,
  semesterYear,
  teacherName,
  teacherNip,
  teacherSignature,
  releaseDate,
}: ReportCardPrintProps) {
  const { t } = useLangStore();

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Format release date to Indonesian
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const dateString = formatDate(releaseDate);

  const getDisciplinePredicate = (score: number) => {
    if (score >= 90) return t('homeroom.excellent') || 'Sangat Baik';
    if (score >= 75) return t('homeroom.good') || 'Baik';
    if (score >= 60) return t('homeroom.sufficient') || 'Cukup';
    return t('homeroom.poor') || 'Kurang';
  };

  return (
    <div className="report-card-print-container">
      {students.map((report, studentIdx) => {
        const hasAchievements = report.achievements && report.achievements.length > 0;
        const pageStyle = {
          padding: '0',
          fontFamily: "'Inter', sans-serif",
          fontSize: '11px',
          lineHeight: '1.4',
        };

        const renderHeaderBlock = (title: string) => (
          <>
            {/* Kop Surat */}
          {schoolProfile?.letterhead ? (
            <div className="letterhead-section" style={{ marginBottom: '8px' }}>
              <img
                src={storageUrl(schoolProfile.letterhead)!}
                alt="Kop Surat"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          ) : (
            <div
              className="letterhead-fallback"
              style={{
                borderBottom: '3px solid #096139',
                paddingBottom: '12px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              {schoolProfile?.logo && (
                <img
                  src={storageUrl(schoolProfile.logo)!}
                  alt="Logo"
                  style={{ width: '70px', height: '70px', objectFit: 'contain' }}
                />
              )}
              <div style={{ flex: 1, textAlign: 'center' }}>
                <p style={{ fontSize: '12px', fontStyle: 'italic', color: '#096139', margin: 0 }}>
                  Islamic Intercultural School
                </p>
                <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#096139', margin: '2px 0' }}>
                  {schoolProfile?.name || 'SMP Progressive Islamic IIS COMMUNITY'}
                </h1>
                <p style={{ fontSize: '9px', color: '#333', margin: 0 }}>
                  {schoolProfile?.address || ''}
                </p>
                <p style={{ fontSize: '9px', color: '#333', margin: 0 }}>
                  {schoolProfile?.phone ? `Telp. ${schoolProfile.phone}` : ''}
                  {schoolProfile?.website ? ` Website: ${schoolProfile.website}` : ''}
                  {schoolProfile?.email ? `, Email: ${schoolProfile.email}` : ''}
                </p>
              </div>
            </div>
          )}

          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '1px', margin: 0 }}>
              {title}
            </h2>
            {semesterYear && (
              <p style={{ fontSize: '12px', fontWeight: 700, margin: '4px 0 0', color: '#333' }}>
                {t('reportCard.academicYear') || 'Tahun Ajaran'} {semesterYear}
              </p>
            )}
            <p style={{ fontSize: '11px', color: '#555', margin: '2px 0 0' }}>
              {semesterName}
            </p>
          </div>

          {/* Student Info */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '4px 24px',
              marginBottom: '14px',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '11px',
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ width: '80px', color: '#666' }}>{t('reportCard.name') || 'Nama'}</span>
              <span style={{ fontWeight: 600 }}>: {report.student.name}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ width: '80px', color: '#666' }}>{t('reportCard.class') || 'Kelas'}</span>
              <span style={{ fontWeight: 600 }}>: {classNameStr}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ width: '80px', color: '#666' }}>{t('reportCard.nisn') || 'NISN'}</span>
              <span>: {report.student.nisn}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ width: '80px', color: '#666' }}>{t('reportCard.nis') || 'NIS'}</span>
              <span>: {report.student.nis}</span>
            </div>
          </div>
          </>
        );

        const SignatureBlock = (
          <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <div
              style={{
                display: 'flex',
              justifyContent: 'space-between',
              marginTop: '16px',
              fontSize: '10px',
            }}
          >
            <div style={{ width: '45%' }}></div>
            <div style={{ width: '45%', textAlign: 'center' }}>
              <p style={{ margin: 0, color: '#555' }}>
                {t('reportCard.sidoarjo') || 'Sidoarjo'}, {dateString}
              </p>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '4px',
              fontSize: '10px',
            }}
          >
            <div style={{ width: '45%', textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px 0', fontWeight: 600 }}>
                {t('reportCard.homeroomTeacher') || 'Homeroom'},
              </p>
              <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px 0' }}>
                {teacherSignature ? (
                    <img
                      src={storageUrl(teacherSignature)!}
                      alt="TTD Homeroom"
                      style={{ maxHeight: '70px', maxWidth: '140px', objectFit: 'contain' }}
                    />
                ) : null}
              </div>
              <p style={{ margin: 0, fontWeight: 700, borderTop: '1px solid #333', display: 'inline-block', paddingTop: '4px', minWidth: '150px' }}>
                {teacherName}
              </p>
              {teacherNip && (
                <p style={{ margin: 0, fontSize: '9px', color: '#666' }}>NIP. {teacherNip}</p>
              )}
            </div>
            <div style={{ width: '45%', textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px 0', fontWeight: 600 }}>
                {t('reportCard.principal') || 'Kepala Sekolah'},
              </p>
              <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px 0' }}>
                {schoolProfile?.principal_signature ? (
                    <img
                      src={storageUrl(schoolProfile.principal_signature)!}
                      alt="TTD Kepala Sekolah"
                      style={{ maxHeight: '70px', maxWidth: '140px', objectFit: 'contain' }}
                    />
                ) : null}
              </div>
              <p style={{ margin: 0, fontWeight: 700, borderTop: '1px solid #333', display: 'inline-block', paddingTop: '4px', minWidth: '150px' }}>
                {schoolProfile?.principal_name || '-'}
              </p>
              {schoolProfile?.principal_nip && (
                <p style={{ margin: 0, fontSize: '9px', color: '#666' }}>NIP. {schoolProfile.principal_nip}</p>
              )}
            </div>
          </div>
          </div>
        );

        return (
          <React.Fragment key={report.student.id}>
            {/* PAGE 1: Akademik, Kedisiplinan, TTD */}
            <div
              className="report-card-page bg-white text-black"
              style={{
                ...pageStyle,
                pageBreakAfter: (hasAchievements || (report.activities && report.activities.length > 0) || studentIdx < students.length - 1) ? 'always' : 'auto',
              }}
            >
              {renderHeaderBlock(t('reportCard.learningReport') || 'LAPORAN HASIL BELAJAR SISWA')}

          {/* Academic Grades Table */}
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '11px', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('reportCard.academicGrades') || 'Nilai Akademik'}
            </h3>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '9.5px',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f0f7f3' }}>
                  <th style={{ border: '1px solid #bbb', padding: '4px 6px', textAlign: 'left', fontWeight: 700, width: '22%' }}>
                    {t('reportCard.subjectName') || 'Mata Pelajaran'}
                  </th>
                  {Array.from({ length: 10 }, (_, i) => {
                    return (
                      <th key={i} style={{ border: '1px solid #bbb', padding: '4px', textAlign: 'center', fontWeight: 600, width: '6.5%' }}>
                        NA{i + 1}
                      </th>
                    );
                  })}
                  <th style={{ border: '1px solid #bbb', padding: '4px', textAlign: 'center', fontWeight: 700, width: '8%', backgroundColor: '#e8f5ee' }}>
                    Ketuntasan
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.grades.map((grade, gIdx) => {
                  const hasAnyValue = grade.na_values.some((v, i) => v !== null && grade.column_types[i] !== 'kosong');
                  if (!hasAnyValue && grade.average === null) return null;

                  return (
                    <tr key={gIdx} style={{ backgroundColor: gIdx % 2 === 0 ? '#fff' : '#fafcfb' }}>
                      <td style={{ border: '1px solid #bbb', padding: '3px 6px', fontWeight: 500 }}>
                        {grade.subject_name}
                      </td>
                      {grade.na_values.map((val, naIdx) => {
                        const colType = grade.column_types[naIdx];
                        const isKosong = colType === 'kosong';
                        const isBelowKkm = val !== null && val < grade.kkm;
                        const colorClass = isKosong ? 'print-text-gray' : isBelowKkm ? 'print-text-red' : '';
                        return (
                          <td key={naIdx} 
                            className={colorClass}
                            style={{ 
                            border: '1px solid #bbb', 
                            padding: '3px', 
                            textAlign: 'center', 
                            color: isKosong ? '#ccc' : isBelowKkm ? '#dc2626' : '#333',
                            fontWeight: 500,
                            backgroundColor: isKosong ? '#f5f5f5' : 'transparent',
                          }}>
                            {isKosong ? '-' : (
                              <div>
                                {val !== null ? val : '-'}
                                {val !== null && colType !== 'kosong' && (
                                  <div style={{ fontSize: '6.5px', color: '#888', marginTop: '1px', textTransform: 'uppercase', fontWeight: 500 }}>
                                    {colType === 'ujian' ? 'Ujian' : colType === 'proyek' ? 'Proyek' : colType}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td 
                        className={grade.completion_percentage !== undefined && grade.completion_percentage < 100 ? "print-text-red" : "print-text-green"}
                        style={{ 
                        border: '1px solid #bbb', 
                        padding: '3px', 
                        textAlign: 'center', 
                        fontWeight: 700, 
                        backgroundColor: '#e8f5ee',
                        color: grade.completion_percentage !== undefined && grade.completion_percentage < 100 ? '#dc2626' : '#096139',
                      }}>
                        {grade.completion_percentage !== undefined ? `${grade.completion_percentage}%` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Discipline row */}
          <div style={{ marginBottom: '12px' }}>
            {/* Discipline */}
            <div style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '10px' }}>
              <h3 style={{ fontSize: '11px', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t('reportCard.disciplinePoints') || 'Sisa Poin Kedisiplinan'}
              </h3>
              {report.discipline ? (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{
                    fontSize: '24px',
                    fontWeight: 800,
                    color: report.discipline.score >= 75 ? '#096139' : report.discipline.score >= 60 ? '#d97706' : '#dc2626',
                  }}>
                    {report.discipline.score}
                  </span>
                  <span style={{ fontSize: '14px', color: '#999' }}>/100</span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    marginLeft: '8px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: report.discipline.score >= 90 ? '#dcfce7' : report.discipline.score >= 75 ? '#e0f2fe' : report.discipline.score >= 60 ? '#fef9c3' : '#fecaca',
                    color: report.discipline.score >= 90 ? '#15803d' : report.discipline.score >= 75 ? '#0369a1' : report.discipline.score >= 60 ? '#a16207' : '#dc2626',
                  }}>
                    {getDisciplinePredicate(report.discipline.score)}
                  </span>
                </div>
              ) : (
                <span style={{ color: '#999', fontSize: '10px' }}>-</span>
              )}
            </div>
          </div>

          {/* Homeroom Note */}
          {report.homeroom_note && (
            <div style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '10px', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '11px', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t('reportCard.homeroomNote') || 'Catatan Homeroom'}
              </h3>
              <p style={{ fontSize: '10px', color: '#444', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>
                "{report.homeroom_note}"
              </p>
            </div>
          )}

          {/* Signatures */}
          <div style={{ marginTop: '32px' }}>
            {SignatureBlock}
          </div>
            </div>

          {/* PAGE 2: Prestasi (Jika Ada) */}
          {hasAchievements && (
            <div
              className="report-card-page bg-white text-black"
              style={{
                ...pageStyle,
                pageBreakAfter: (report.activities && report.activities.length > 0 && studentIdx < students.length - 1) ? 'always' : (studentIdx < students.length - 1 && (!report.activities || report.activities.length === 0) ? 'always' : 'auto'),
              }}
            >
              {renderHeaderBlock('LAPORAN PRESTASI DAN PENGHARGAAN')}

              <div style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '10px', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '11px', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Prestasi & Penghargaan
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={{ border: '1px solid #eee', padding: '4px', textAlign: 'left', width: '5%' }}>No</th>
                    <th style={{ border: '1px solid #eee', padding: '4px', textAlign: 'left', width: '40%' }}>Nama Kompetisi</th>
                    <th style={{ border: '1px solid #eee', padding: '4px', textAlign: 'left', width: '30%' }}>Prestasi</th>
                    <th style={{ border: '1px solid #eee', padding: '4px', textAlign: 'left', width: '25%' }}>Tingkat</th>
                  </tr>
                </thead>
                <tbody>
                  {report.achievements.map((ach, idx) => (
                    <tr key={ach.id}>
                      <td style={{ border: '1px solid #eee', padding: '4px', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #eee', padding: '4px' }}>{ach.competition_name}</td>
                      <td style={{ border: '1px solid #eee', padding: '4px' }}>{ach.achievement}</td>
                      <td style={{ border: '1px solid #eee', padding: '4px' }}>{ach.level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{ marginTop: '32px' }}>
              {SignatureBlock}
            </div>
            </div>
          )}

          {/* PAGE 3: Laporan Digiart & Ekstra */}
          {report.activities && report.activities.length > 0 && (
            <div
              className="report-card-page bg-white text-black"
              style={{
                ...pageStyle,
                pageBreakAfter: studentIdx < students.length - 1 ? 'always' : 'auto',
              }}
            >
              {renderHeaderBlock('LAPORAN HASIL KEGIATAN DIGIART & EKSTRAKURIKULER')}

              <div style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '10px', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '11px', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Aktivitas & Keterampilan
                </h3>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      <th style={{ border: '1px solid #eee', padding: '4px', textAlign: 'center', width: '5%' }}>No</th>
                      <th style={{ border: '1px solid #eee', padding: '4px', textAlign: 'left', width: '25%' }}>Nama Kegiatan</th>
                      <th style={{ border: '1px solid #eee', padding: '4px', textAlign: 'left', width: '15%' }}>Jenis</th>
                      <th style={{ border: '1px solid #eee', padding: '4px', textAlign: 'center', width: '15%' }}>Kehadiran</th>
                      <th style={{ border: '1px solid #eee', padding: '4px', textAlign: 'center', width: '10%' }}>Nilai</th>
                      <th style={{ border: '1px solid #eee', padding: '4px', textAlign: 'center', width: '30%' }}>Portofolio (QR Code)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.activities.map((act, idx) => (
                      <tr key={idx}>
                        <td style={{ border: '1px solid #eee', padding: '4px', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ border: '1px solid #eee', padding: '4px', fontWeight: 600 }}>{act.group_name}</td>
                        <td style={{ border: '1px solid #eee', padding: '4px', textTransform: 'capitalize' }}>{act.type}</td>
                        <td style={{ border: '1px solid #eee', padding: '4px', textAlign: 'center' }}>{act.attendance_percentage}%</td>
                        <td style={{ border: '1px solid #eee', padding: '4px', textAlign: 'center', fontWeight: 700, fontSize: '12px' }}>{act.grade || '-'}</td>
                        <td style={{ border: '1px solid #eee', padding: '8px', textAlign: 'center' }}>
                          {act.portfolio_link ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                              <QRCodeCanvas value={act.portfolio_link} size={60} level="H" />
                              <span style={{ fontSize: '8px', color: '#666' }}>Scan untuk melihat</span>
                            </div>
                          ) : (
                            <span style={{ color: '#999', fontSize: '9px', fontStyle: 'italic' }}>Belum ada portofolio</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '32px' }}>
                {SignatureBlock}
              </div>
            </div>
          )}
          </React.Fragment>
        );
      })}

      {/* Print-specific styles */}
      <style>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .report-card-print-container .print-text-red { color: #dc2626 !important; }
          .report-card-print-container .print-text-green { color: #096139 !important; }
          .report-card-print-container .print-text-gray { color: #ccc !important; }
          .report-card-print-container {
            margin: 0 !important;
            padding: 0 !important;
          }
          .report-card-page {
            margin: 0 !important;
            padding: 10mm !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 5mm;
          }
        }
        @media screen {
          .report-card-print-container {
            overflow-x: auto;
            width: 100%;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 10px;
          }
          .report-card-page {
            width: 210mm;
            min-width: 210mm;
            max-width: 210mm;
            min-height: 297mm;
            margin: 0 auto 20px;
            padding: 15mm;
            box-shadow: 0 2px 12px rgba(0,0,0,0.1);
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: #fff;
          }
        }
      `}</style>
    </div>
  );
}
