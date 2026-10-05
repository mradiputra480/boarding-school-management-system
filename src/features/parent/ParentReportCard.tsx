import { useState, useEffect, useRef } from 'react';
import ParentLayout from '@/components/layouts/ParentLayout';
import { useLangStore } from '@/stores/langStore';
import api from '@/lib/axios';
import { FileText, Printer, XCircle } from 'lucide-react';
import ReportCardPrint from '@/features/teacher/ReportCardPrint';

export default function ParentReportCard() {
  const { t } = useLangStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPrint, setShowPrint] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try { const res = await api.get('/parent/report-card'); setData(res.data); }
      catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const handlePrint = () => {
    setShowPrint(true);
    setTimeout(() => { window.print(); }, 500);
  };

  if (loading) return <ParentLayout title={t('parent.reportCard')}><div className="flex items-center justify-center h-64 text-layout-muted">{t('common.loading')}</div></ParentLayout>;

  // Not published
  if (!data?.is_published) {
    return (
      <ParentLayout title={t('parent.reportCard')}>
        <div className="bg-layout-card border border-layout-border rounded-xl p-12 text-center">
          <XCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-layout-text mb-2">{t('parent.reportNotPublished')}</h2>
          <p className="text-sm text-layout-muted">{data?.message || ''}</p>
        </div>
      </ParentLayout>
    );
  }

  // Format student data for ReportCardPrint component
  const studentReport = [{
    student: data.student,
    grades: data.grades,
    discipline: data.discipline,
    achievements: data.achievements,
    activities: data.activities,
    attendance: data.attendance,
    homeroom_note: data.homeroom_note,
  }];

  const releaseDate = new Date().toISOString().split('T')[0];

  return (
    <ParentLayout title={t('parent.reportCard')}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-[#d4a23a]" />
            <h2 className="text-lg font-bold text-layout-text">{t('parent.reportCard')}</h2>
          </div>
          <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2.5 bg-[#2d7a50] hover:bg-[#1a4a30] text-white rounded-lg font-semibold text-sm transition-colors w-full sm:w-auto justify-center">
            <Printer className="w-4 h-4" />
            {t('parent.printReport')}
          </button>
        </div>

        {/* Print View */}
        {showPrint && (
          <div className="print:block">
            <div className="flex justify-end mb-4 print:hidden">
              <button onClick={() => setShowPrint(false)} className="text-sm text-layout-muted hover:text-layout-text font-medium">
                ✕ {t('common.close') || 'Tutup'} Preview
              </button>
            </div>
            <div ref={printRef}>
              <ReportCardPrint
                students={studentReport}
                schoolProfile={data.school_profile}
                className={data.class?.name || ''}
                classLevel={data.class?.level || ''}
                semesterName={data.semester?.name || ''}
                semesterYear={data.semester?.year || ''}
                teacherName={data.teacher?.name || ''}
                teacherNip={data.teacher?.nip || null}
                teacherSignature={data.teacher?.signature || null}
                releaseDate={releaseDate}
              />
            </div>
          </div>
        )}

        {/* Inline preview (always visible) */}
        {!showPrint && (
          <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden">
            <ReportCardPrint
              students={studentReport}
              schoolProfile={data.school_profile}
              className={data.class?.name || ''}
              classLevel={data.class?.level || ''}
              semesterName={data.semester?.name || ''}
              semesterYear={data.semester?.year || ''}
              teacherName={data.teacher?.name || ''}
              teacherNip={data.teacher?.nip || null}
              teacherSignature={data.teacher?.signature || null}
              releaseDate={releaseDate}
            />
          </div>
        )}
      </div>
    </ParentLayout>
  );
}
