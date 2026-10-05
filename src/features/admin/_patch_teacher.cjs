const fs = require('fs');
const file = 'C:/laragon/www/siakad-app/frontend/src/features/admin/TeacherPage.tsx';
let c = fs.readFileSync(file, 'utf8');

// Find the closing </label> after Analisis Kurikulum, then the </div> </div> after it
// and insert the Tentor checkbox + master activity selector
const target = `                        </label>\r
                    </div>\r
                  </div>`;

const replacement = `                        </label>
                        <label className="flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl cursor-pointer hover:bg-orange-500/20 transition-colors">
                          <input type="checkbox" checked={formData.is_tentor} onChange={e => setFormData({...formData, is_tentor: e.target.checked})} className="w-4 h-4 text-orange-600 rounded mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-orange-700">Tentor Ekstra / Digiart</p>
                            <p className="text-[10px] text-orange-600/70 leading-tight mt-0.5">Pembimbing / Pelatih kegiatan</p>
                          </div>
                        </label>
                    </div>
                    {formData.is_tentor && (
                      <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded-xl">
                        <p className="text-xs font-bold text-orange-700 mb-2">Pilih Ekstra / Digiart yang Diampu:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                          {masterActivities.map(ma => (
                            <label key={ma.id} className="flex items-center gap-2 p-2 bg-white dark:bg-layout-card border border-layout-border rounded-lg cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors text-xs">
                              <input type="checkbox" checked={selMasterActivities.includes(ma.id)} onChange={() => {
                                setSelMasterActivities(prev => prev.includes(ma.id) ? prev.filter(id => id !== ma.id) : [...prev, ma.id]);
                              }} className="w-3.5 h-3.5 text-orange-600 rounded" />
                              <span className="capitalize truncate">{ma.name}</span>
                              <span className={\`shrink-0 ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold uppercase \${ma.type === 'ekstra' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}\`}>{ma.type}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>`;

if (c.includes(target)) {
  c = c.replace(target, replacement);
  fs.writeFileSync(file, c, 'utf8');
  console.log('SUCCESS: Tentor checkbox + master activity selector added');
} else {
  console.log('ERROR: target not found');
  // Try without \r
  const target2 = target.replace(/\r/g, '');
  if (c.includes(target2)) {
    c = c.replace(target2, replacement);
    fs.writeFileSync(file, c, 'utf8');
    console.log('SUCCESS (no CR): Tentor checkbox + master activity selector added');
  } else {
    console.log('ERROR: target2 also not found');
  }
}
