import { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import api from '@/lib/axios';
import { useLangStore } from '@/stores/langStore';
import { Save, Upload, Building2, MapPin, Phone, Mail, Globe, User, Award, Hash, MessageCircle, PenLine } from 'lucide-react';
import { storageUrl } from '@/lib/storage';
import { alertDialog, confirmDialog, promptDialog } from '@/lib/swal';

const inp = "w-full bg-layout-card border border-[#bfc9bf] rounded-lg px-3 py-2.5 text-[14px] text-layout-text focus:outline-none focus:border-[#096139] focus:ring-1 focus:ring-[#096139] transition-all";
const lbl = "flex items-center gap-1.5 text-[13px] font-semibold text-layout-text mb-1.5";

interface Profile {
  id: number; name: string; address: string|null;
  phone: string|null; email: string|null; website: string|null; logo: string|null;
  principal_name: string|null; principal_nip: string|null; principal_signature: string|null;
  npsn: string|null; accreditation: string|null;
  wa_number: string|null; letterhead: string|null;
  parent_menu_access: Record<string, boolean>|null;
  parent_menu_access: Record<string, boolean>|null;
}

export default function SchoolProfilePage() { 
  const { t } = useLangStore();
  const [profile, setProfile] = useState<Profile|null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File|null>(null);
  const [logoPreview, setLogoPreview] = useState<string|null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const [letterheadFile, setLetterheadFile] = useState<File|null>(null);
  const [letterheadPreview, setLetterheadPreview] = useState<string|null>(null);
  const letterheadRef = useRef<HTMLInputElement>(null);
  const [signatureFile, setSignatureFile] = useState<File|null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string|null>(null);
  const signatureRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name:'', address:'', phone:'', email:'', website:'',
    principal_name:'', principal_nip:'', npsn:'', accreditation:'',
    wa_number:''
  });
  const [parentMenuAccess, setParentMenuAccess] = useState<Record<string, boolean>>({
    report_card: false,
    discipline: false,
    discipline_show_detail: true,
    achievements: false,
    assessment_events: true,
    documents: true,
    graduation: true
  });

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/admin/school-profile');
        const d = r.data.data;
        setProfile(d);
        setForm({
          name: d.name||'', address: d.address||'', phone: d.phone||'',
          email: d.email||'', website: d.website||'',
          principal_name: d.principal_name||'', principal_nip: d.principal_nip||'',
          npsn: d.npsn||'', accreditation: d.accreditation||'',
          wa_number: d.wa_number||''
        });
        if (d.parent_menu_access) {
          setParentMenuAccess(prev => ({ ...prev, ...d.parent_menu_access }));
        }
        const v = d.updated_at ? new Date(d.updated_at).getTime() : Date.now();
        if(d.logo) setLogoPreview(storageUrl(d.logo, v)!);
        if(d.letterhead) setLetterheadPreview(storageUrl(d.letterhead, v)!);
        if(d.principal_signature) setSignaturePreview(storageUrl(d.principal_signature, v)!);
      } catch{} finally { setLoading(false); }
    })();
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if(f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); }
  };

  const handleLetterheadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if(f) { setLetterheadFile(f); setLetterheadPreview(URL.createObjectURL(f)); }
  };

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if(f) { setSignatureFile(f); setSignaturePreview(URL.createObjectURL(f)); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => fd.append(k,v));
      if(logoFile) fd.append('logo', logoFile);
      if(letterheadFile) fd.append('letterhead', letterheadFile);
      if(signatureFile) fd.append('principal_signature', signatureFile);
      fd.append('parent_menu_access', JSON.stringify(parentMenuAccess));
      const r = await api.post('/admin/school-profile', fd, {headers:{'Content-Type':'multipart/form-data'}});
      setProfile(r.data.data);
      alertDialog('✅ Profil sekolah berhasil disimpan!');
    } catch(err:any) { alertDialog(err.response?.data?.message || 'Gagal menyimpan'); }
    finally { setSaving(false); }
  };

  if(loading) return <AdminLayout title={t('settings.title')}><div className="flex items-center justify-center h-64 text-layout-muted">{t("common.loading")}</div></AdminLayout>;

  return (
    <AdminLayout title={t('settings.title')}>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT: Profil Sekolah (3 cols) */}
        <div className="lg:col-span-3 bg-layout-card border border-layout-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-layout-border">
            <h2 className="text-lg font-bold text-layout-text flex items-center gap-2"><Building2 className="w-5 h-5 text-[#2d7a50]"/>{t('settings.schoolProfile')}</h2>
          </div>
          <div className="p-6 space-y-5">
            {/* Logo */}
            <div className="flex items-start gap-5">
              <input type="file" ref={logoRef} accept="image/*" className="hidden" onChange={handleLogoChange}/>
              <div
                onClick={()=>logoRef.current?.click()}
                className="w-[88px] h-[88px] rounded-2xl bg-[#2d7a50]/10 border-2 border-dashed border-[#2d7a50]/30 hover:border-[#2d7a50] flex items-center justify-center cursor-pointer overflow-hidden transition-all shrink-0"
              >
                {logoPreview
                  ? <img src={logoPreview} className="w-full h-full object-contain p-1"/>
                  : <Building2 className="w-8 h-8 text-[#2d7a50]/40"/>}
              </div>
              <div className="pt-2">
                <p className="text-sm text-layout-text font-medium">{t('settings.schoolLogo')}</p>
                <p className="text-xs text-layout-muted mb-2">{t('settings.logoDesc')}</p>
                <button onClick={()=>logoRef.current?.click()} className="text-[#2d7a50] text-sm font-semibold hover:underline flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5"/>{logoPreview?t('settings.changeLogo'):t('settings.uploadLogo')}
                </button>
              </div>
            </div>

            {/* Letterhead / Kop Surat */}
            <div className="pt-3 border-t border-layout-border">
              <input type="file" ref={letterheadRef} accept="image/*" className="hidden" onChange={handleLetterheadChange}/>
              <div className="flex items-start gap-5">
                <div
                  onClick={()=>letterheadRef.current?.click()}
                  className="w-full max-w-[400px] h-[100px] rounded-xl bg-[#2d7a50]/5 border-2 border-dashed border-[#2d7a50]/30 hover:border-[#2d7a50] flex items-center justify-center cursor-pointer overflow-hidden transition-all shrink-0"
                >
                  {letterheadPreview
                    ? <img src={letterheadPreview} className="w-full h-full object-contain p-1"/>
                    : <span className="text-[#2d7a50]/40 text-sm font-medium">Kop Surat</span>}
                </div>
                <div className="pt-2">
                  <p className="text-sm text-layout-text font-medium">{t('settings.letterhead')}</p>
                  <p className="text-xs text-layout-muted mb-2">{t('settings.letterheadDesc')}</p>
                  <button onClick={()=>letterheadRef.current?.click()} className="text-[#2d7a50] text-sm font-semibold hover:underline flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5"/>{letterheadPreview?t('settings.changeLetterhead'):t('settings.uploadLetterhead')}
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label className={lbl}><Building2 className="w-4 h-4 text-layout-muted"/>{t('settings.schoolName')}</label>
              <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className={inp} placeholder="IIS SMP Progressive Islamic IIS COMMUNITY"/>
            </div>
            <div>
              <label className={lbl}><MapPin className="w-4 h-4 text-layout-muted"/>{t('settings.address')}</label>
              <textarea value={form.address} onChange={e=>setForm({...form,address:e.target.value})} rows={2} className={inp+" resize-none"}/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}><Phone className="w-4 h-4 text-layout-muted"/>{t('settings.phone')}</label>
                <input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className={inp} placeholder="(031) 896xxxx"/>
              </div>
              <div>
                <label className={lbl}><Mail className="w-4 h-4 text-layout-muted"/>{t('settings.email')}</label>
                <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className={inp} placeholder="info@sekolah.sch.id"/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}><Globe className="w-4 h-4 text-layout-muted"/>{t('settings.website')}</label>
                <input value={form.website} onChange={e=>setForm({...form,website:e.target.value})} className={inp} placeholder="www.sekolah.sch.id"/>
              </div>
              <div>
                <label className={lbl}><MessageCircle className="w-4 h-4 text-[#25D366]"/>{t('settings.waNumber')}</label>
                <input value={form.wa_number} onChange={e=>setForm({...form,wa_number:e.target.value})} className={inp} placeholder="628xxxxxxxxxx"/>
                <p className="text-[11px] text-layout-muted mt-1">{t('settings.waDesc')}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-layout-border">
              <h3 className="text-[14px] font-bold text-layout-text mb-3 flex items-center gap-2"><User className="w-4 h-4 text-[#2d7a50]"/>{t('settings.principal')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>{t('settings.principalName')}</label>
                  <input value={form.principal_name} onChange={e=>setForm({...form,principal_name:e.target.value})} className={inp} placeholder={t("common.fullName")}/>
                </div>
                <div>
                  <label className={lbl}>{t('settings.principalNip')}</label>
                  <input value={form.principal_nip} onChange={e=>setForm({...form,principal_nip:e.target.value})} className={inp} placeholder="NIP"/>
                </div>
              </div>
            </div>

            {/* TTD Kepala Sekolah */}
            <div className="pt-3 border-t border-layout-border">
              <h3 className="text-[14px] font-bold text-layout-text mb-3 flex items-center gap-2"><PenLine className="w-4 h-4 text-[#d4a23a]"/>TTD Kepala Sekolah</h3>
              <input type="file" ref={signatureRef} accept="image/*" className="hidden" onChange={handleSignatureChange}/>
              <div className="flex items-start gap-5">
                <div
                  onClick={()=>signatureRef.current?.click()}
                  className="w-[180px] h-[80px] rounded-xl bg-[#d4a23a]/5 border-2 border-dashed border-[#d4a23a]/30 hover:border-[#d4a23a] flex items-center justify-center cursor-pointer overflow-hidden transition-all shrink-0"
                >
                  {signaturePreview
                    ? <img src={signaturePreview} className="w-full h-full object-contain p-1"/>
                    : <span className="text-[#d4a23a]/40 text-sm font-medium">✍️ TTD</span>}
                </div>
                <div className="pt-2">
                  <p className="text-sm text-layout-text font-medium">Tanda Tangan Kepala Sekolah</p>
                  <p className="text-xs text-layout-muted mb-2">Scan TTD dengan background transparan (PNG). Muncul di rapor digital.</p>
                  <button onClick={()=>signatureRef.current?.click()} className="text-[#d4a23a] text-sm font-semibold hover:underline flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5"/>{signaturePreview?'Ganti TTD':'Upload TTD'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-[#2d7a50] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#3d9968] disabled:opacity-70 transition-colors">
                <Save className="w-4 h-4"/>{saving?t('common.saving'):t('settings.saveProfile')}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Info Tambahan (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Identitas Sekolah */}
          <div className="bg-layout-card border border-layout-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-layout-border">
              <h2 className="text-lg font-bold text-layout-text flex items-center gap-2"><Hash className="w-5 h-5 text-[#3a8fd4]"/>{t('settings.identity')}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={lbl}><Hash className="w-4 h-4 text-layout-muted"/>{t('settings.npsn')}</label>
                <input value={form.npsn} onChange={e=>setForm({...form,npsn:e.target.value})} className={inp} placeholder={t('settings.npsnFull')}/>
              </div>
              <div>
                <label className={lbl}><Award className="w-4 h-4 text-layout-muted"/>{t('settings.accreditation')}</label>
                <select value={form.accreditation} onChange={e=>setForm({...form,accreditation:e.target.value})} className={inp}>
                  <option value="">{t('settings.selectAccreditation')}</option>
                  <option value="A">A ({t('settings.excellent')})</option>
                  <option value="B">B ({t('settings.good')})</option>
                  <option value="C">C ({t('settings.sufficient')})</option>
                  <option value="Belum">{t('settings.notAccredited')}</option>
                </select>
              </div>
              <div className="flex justify-end pt-2">
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-[#3a8fd4] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#2d7abc] disabled:opacity-70 transition-colors">
                  <Save className="w-4 h-4"/>{t('common.save')}
                </button>
              </div>
            </div>
          </div>

          {/* Akses Menu Orang Tua */}
          <div className="bg-layout-card border border-layout-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-layout-border">
              <h2 className="text-lg font-bold text-layout-text flex items-center gap-2"><Building2 className="w-5 h-5 text-indigo-500"/>Akses Menu Orang Tua</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-layout-muted mb-4">Aktifkan atau nonaktifkan menu yang tampil di Portal Orang Tua.</p>
              
              <div className="space-y-3">
                {[
                  { key: 'report_card', label: 'Rekap Nilai Akademis' },
                  { key: 'discipline', label: 'Kedisiplinan' },
                  { key: 'discipline_show_detail', label: 'Tampilkan Detail Pelanggaran (Kedisiplinan)' },
                  { key: 'achievements', label: 'Prestasi & Penghargaan' },
                  { key: 'assessment_events', label: 'Penilaian Eksternal' },
                  { key: 'documents', label: 'Distribusi Dokumen' },
                  { key: 'graduation', label: 'Kelulusan (Khusus Kelas IX)' },
                ].map((menu) => (
                  <label key={menu.key} className="flex items-center justify-between cursor-pointer p-3 bg-layout-bg rounded-lg border border-layout-border hover:bg-layout-hover transition-colors">
                    <span className="text-sm font-semibold text-layout-text">{menu.label}</span>
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={parentMenuAccess[menu.key] || false}
                        onChange={(e) => setParentMenuAccess({...parentMenuAccess, [menu.key]: e.target.checked})}
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${parentMenuAccess[menu.key] ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${parentMenuAccess[menu.key] ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-600 disabled:opacity-70 transition-colors">
                  <Save className="w-4 h-4"/>{t('common.save')}
                </button>
              </div>
            </div>
          </div>

          {/* Info Ringkasan */}
          <div className="bg-layout-card border border-layout-border rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-layout-text mb-3">📋 {t('settings.infoTitle')}</h3>
            <div className="space-y-2 text-sm text-layout-muted">
              <p>• {t('settings.info1')}</p>
              <p>• {t('settings.info2')}</p>
              <p>• {t('settings.info3')}</p>
              <p>• {t('settings.info4')}</p>
              <p>• <strong className="text-[#25D366]">📱</strong> {t('settings.info5')}</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
