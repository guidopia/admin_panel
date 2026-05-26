import { api } from './api.js';

/**
 * Download a file from an authenticated admin export endpoint.
 * @param {string} path - e.g. `/api/users/abc/export?format=xlsx`
 * @param {string} filename - suggested download name
 */
function filenameFromDisposition(header) {
  if (!header) return null;
  const match = /filename="?([^";\n]+)"?/i.exec(header);
  return match?.[1]?.trim() || null;
}

export async function downloadExport(path, fallbackFilename) {
  const res = await api.get(path, {
    responseType: 'blob',
    timeout: 180000,
  });

  if (res.status >= 400) {
    const text = await res.data.text();
    let message = 'Export failed';
    try {
      const json = JSON.parse(text);
      message = json.message || message;
    } catch {
      message = text || message;
    }
    throw new Error(message);
  }

  const contentType = res.headers['content-type'] || '';

  const filename =
    filenameFromDisposition(res.headers['content-disposition']) || fallbackFilename;

  const blob = new Blob([res.data], {
    type: contentType || 'application/octet-stream',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
