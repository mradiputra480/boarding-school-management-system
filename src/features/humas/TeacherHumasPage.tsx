import TeacherLayout from '@/components/layouts/TeacherLayout';
import EventList from '@/features/humas/EventList';

export default function TeacherHumasPage() {
  return (
    <TeacherLayout title="Agenda Kegiatan Sekolah (Humas)">
      <div className="space-y-6">
        <EventList source="humas" />
      </div>
    </TeacherLayout>
  );
}
