import TeacherLayout from '@/components/layouts/TeacherLayout';
import PrestasiList from './PrestasiList';

export default function TeacherIccPage() {
  return (
    <TeacherLayout title="Prestasi Siswa (ICC)">
      <div className="space-y-6">
        <PrestasiList />
      </div>
    </TeacherLayout>
  );
}
