import { useAuthStore } from '@/stores/authStore';

function downloadUrl(url: string) {
  const token = useAuthStore.getState().token;
  const a = document.createElement('a');
  // Use fetch to add auth header, then trigger download
  fetch(`/api${url}`, { headers: { Authorization: `Bearer ${token}` } })
    .then((res) => res.blob())
    .then((blob) => {
      const href = URL.createObjectURL(blob);
      a.href = href;
      // Extract filename from url
      const name = url.split('/').pop() || 'export';
      a.download = `${name}.xlsx`;
      a.click();
      URL.revokeObjectURL(href);
    });
}

export const exportMembers = () => downloadUrl('/export/members');
export const exportOrders = (params?: { start?: string; end?: string }) => {
  const qs = new URLSearchParams();
  if (params?.start) qs.set('start', params.start);
  if (params?.end) qs.set('end', params.end);
  const q = qs.toString();
  downloadUrl(`/export/orders${q ? '?' + q : ''}`);
};
export const exportProducts = () => downloadUrl('/export/products');

export const importMembers = (file: File): Promise<{ success: number; skipped: number; errors: string[] }> => {
  const form = new FormData();
  form.append('file', file);
  // Use the request instance to include auth header
  return import('./request').then(({ default: request }) =>
    request.post('/import/members', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  );
};
