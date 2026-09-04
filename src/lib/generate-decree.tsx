'use client';

import type { DecreeData } from '@/components/garuda/DecreeDocument';

/** Batas maksimal ketetapan yang boleh dicetak sekaligus dalam satu file PDF */
export const MAX_BULK_DECREE = 50;

const sanitizeFileName = (value: string) => value.replace(/[\\/:*?"<>|]/g, '').trim() || 'Ketetapan';

const triggerDownload = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Merender surat ketetapan Garuda ke PDF lalu mengunduhnya.
 * Library PDF di-import dinamis supaya tidak ikut bundle awal halaman.
 */
export const downloadGarudaDecree = async (data: DecreeData) => {
  const [{ pdf }, { DecreeDocument }] = await Promise.all([import('@react-pdf/renderer'), import('@/components/garuda/DecreeDocument')]);

  const blob = await pdf(<DecreeDocument data={data} />).toBlob();

  triggerDownload(blob, `Ketetapan Garuda - ${sanitizeFileName(data.name)}.pdf`);
};

/**
 * Merender banyak ketetapan sekaligus jadi satu file PDF (satu halaman per anggota).
 * Maksimal {@link MAX_BULK_DECREE} data per unduhan supaya render di browser tetap aman.
 */
export const downloadGarudaDecrees = async (items: DecreeData[]) => {
  if (!items.length) {
    throw new Error('Tidak ada data yang dipilih');
  }

  if (items.length > MAX_BULK_DECREE) {
    throw new Error(`Maksimal ${MAX_BULK_DECREE} ketetapan sekali cetak`);
  }

  const [{ pdf }, { DecreeBulkDocument }] = await Promise.all([import('@react-pdf/renderer'), import('@/components/garuda/DecreeDocument')]);

  const blob = await pdf(<DecreeBulkDocument items={items} />).toBlob();

  triggerDownload(blob, `Ketetapan Garuda - ${items.length} Data.pdf`);
};
