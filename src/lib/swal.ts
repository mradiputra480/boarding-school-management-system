import Swal from 'sweetalert2';

export const appSwal = Swal.mixin({
  customClass: {
    confirmButton: 'bg-[#2d7a50] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#1a4a30] transition-colors',
    cancelButton: 'bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold border border-gray-300 hover:bg-gray-200 transition-colors',
    denyButton: 'bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 transition-colors',
    popup: 'rounded-2xl border border-layout-border shadow-xl',
    title: 'text-lg font-bold text-layout-text',
    htmlContainer: 'text-sm text-layout-muted',
    input: 'border border-layout-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d7a50] w-full mt-2'
  },
  buttonsStyling: false // use Tailwind classes above
});

/**
 * Helper untuk konfirmasi (Ya/Tidak)
 */
export const confirmDialog = async (text: string, title: string = 'Konfirmasi', isDanger: boolean = false) => {
  const result = await appSwal.fire({
    title,
    text,
    icon: isDanger ? 'warning' : 'question',
    showCancelButton: true,
    confirmButtonText: 'Ya',
    cancelButtonText: 'Batal',
    customClass: {
      confirmButton: isDanger 
        ? 'bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 transition-colors mr-2' 
        : 'bg-[#2d7a50] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#1a4a30] transition-colors mr-2',
      cancelButton: 'bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold border border-gray-300 hover:bg-gray-200 transition-colors',
      popup: 'rounded-2xl border border-layout-border shadow-xl',
      title: 'text-lg font-bold text-layout-text',
      htmlContainer: 'text-sm text-layout-muted'
    }
  });
  return result.isConfirmed;
};

/**
 * Helper untuk peringatan/informasi
 */
export const alertDialog = (text: string, icon: 'success'|'error'|'warning'|'info' = 'info', title?: string) => {
  return appSwal.fire({
    title: title || (icon === 'error' ? 'Oops...' : 'Informasi'),
    text,
    icon
  });
};

/**
 * Helper untuk input teks (prompt)
 */
export const promptDialog = async (title: string, defaultValue: string = '') => {
  const result = await appSwal.fire({
    title,
    input: 'text',
    inputValue: defaultValue,
    showCancelButton: true,
    confirmButtonText: 'Simpan',
    cancelButtonText: 'Batal'
  });
  return result.isConfirmed ? result.value : null;
};

export default appSwal;
