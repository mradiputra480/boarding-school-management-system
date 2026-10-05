import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import api from '@/lib/axios';
import { confirmDialog, alertDialog } from '@/lib/swal';

interface MasterActivity {
  id: number;
  name: string;
  type: 'ekstra' | 'digiart';
}

export default function MasterActivityPage() {
  const [data, setData] = useState<MasterActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [modal, setModal] = useState(false);
  const [formData, setFormData] = useState<{id: number|null; name: string; type: 'ekstra'|'digiart'}>({id: null, name: '', type: 'ekstra'});

  const fetch = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/master-activities');
      setData(res.data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await api.put(`/admin/master-activities/${formData.id}`, formData);
        alertDialog('Data berhasil diupdate', 'success', 'Sukses');
      } else {
        await api.post('/admin/master-activities', formData);
        alertDialog('Data berhasil ditambahkan', 'success', 'Sukses');
      }
      setModal(false);
      fetch();
    } catch (err: any) {
      alertDialog(err.response?.data?.message || 'Terjadi kesalahan', 'error', 'Error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!(await confirmDialog('Hapus data ini? Semua data terkait yang menggunakannya mungkin akan terdampak.', 'Hapus Master Data', true))) return;
    try {
      await api.delete(`/admin/master-activities/${id}`);
      fetch();
      alertDialog('Berhasil dihapus', 'success', 'Sukses');
    } catch {
      alertDialog('Gagal menghapus', 'error', 'Error');
    }
  };

  const filtered = data.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout title="Master Ekstra & Digiart">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-layout-muted absolute left-3 top-1/2 -translate-y-1/2"/>
          <input type="text" placeholder="Cari nama aktivitas..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-layout-bg border border-layout-border rounded-lg text-sm focus:outline-none focus:border-[#2d7a50]"/>
        </div>
        <button onClick={() => { setFormData({id: null, name: '', type: 'ekstra'}); setModal(true); }} className="flex items-center gap-2 bg-[#2d7a50] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#3d9968] w-full sm:w-auto">
          <Plus className="w-4 h-4"/> Tambah Data
        </button>
      </div>

      <div className="bg-layout-card border border-layout-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-layout-muted uppercase bg-layout-bg/50 border-b border-layout-border">
              <tr>
                <th className="px-6 py-4 font-semibold text-center w-16">No</th>
                <th className="px-6 py-4 font-semibold">Nama Aktivitas</th>
                <th className="px-6 py-4 font-semibold w-40 text-center">Tipe</th>
                <th className="px-6 py-4 font-semibold text-right w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-layout-border">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-layout-muted">Memuat data...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-layout-muted">Tidak ada data ditemukan</td></tr>
              ) : filtered.map((d, i) => (
                <tr key={d.id} className="hover:bg-layout-bg/30">
                  <td className="px-6 py-4 text-center text-layout-muted">{i+1}</td>
                  <td className="px-6 py-4 font-bold text-layout-text capitalize">{d.name}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${d.type === 'ekstra' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {d.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setFormData({id: d.id, name: d.name, type: d.type}); setModal(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4"/></button>
                      <button onClick={() => handleDelete(d.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-layout-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-layout-border">
              <h3 className="font-bold text-lg text-layout-text">{formData.id ? 'Edit Master Data' : 'Tambah Master Data'}</h3>
              <button onClick={() => setModal(false)} className="text-layout-muted hover:text-layout-text"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSave} className="p-4 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-layout-text">Nama Ekstra / Digiart</label>
                <input required type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full bg-layout-bg border border-layout-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d7a50]" placeholder="Cth: Atletik Putra" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-layout-text">Tipe Kategori</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={formData.type === 'ekstra'} onChange={() => setFormData({...formData, type: 'ekstra'})} className="w-4 h-4 text-[#2d7a50]" />
                    <span className="text-sm font-medium">Ekstrakurikuler</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={formData.type === 'digiart'} onChange={() => setFormData({...formData, type: 'digiart'})} className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Digiart</span>
                  </label>
                </div>
              </div>
              
              <div className="mt-4 flex gap-2 justify-end">
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm font-medium text-layout-muted hover:text-layout-text">Batal</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold bg-[#2d7a50] text-white rounded-lg hover:bg-[#3d9968]">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
