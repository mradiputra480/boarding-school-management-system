import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import EventList from '@/features/humas/EventList';

export default function AdminEventPage() {
  return (
    <AdminLayout title="Agenda Kegiatan Kurikulum">
      <div className="space-y-6">
        <EventList source="admin" />
      </div>
    </AdminLayout>
  );
}
