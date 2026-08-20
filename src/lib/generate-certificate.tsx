'use client';

import type { CertificateData } from '@/components/garuda/CertificateDocument';

const FRAME_PATH = '/image/bingkai.png';
const LOGO_PATH = '/image/logo.png';

/** Batas maksimal sertifikat yang boleh dicetak sekaligus dalam satu file PDF */
export const MAX_BULK_CERTIFICATE = 50;

const sanitizeFileName = (value: string) => value.replace(/[\\/:*?"<>|]/g, '').trim() || 'Sertifikat';

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
 * Merender sertifikat Garuda ke PDF lalu mengunduhnya.
 * Library PDF di-import dinamis supaya tidak ikut bundle awal halaman.
 */
export const downloadGarudaCertificate = async (data: CertificateData) => {
  const [{ pdf }, { CertificateDocument }] = await Promise.all([import('@react-pdf/renderer'), import('@/components/garuda/CertificateDocument')]);

  const origin = window.location.origin;
  const blob = await pdf(<CertificateDocument data={data} frameSrc={`${origin}${FRAME_PATH}`} logoSrc={`${origin}${LOGO_PATH}`} />).toBlob();

  triggerDownload(blob, `Sertifikat Garuda - ${sanitizeFileName(data.name)}.pdf`);
};

/**
 * Merender banyak sertifikat sekaligus jadi satu file PDF (satu halaman per anggota).
 * Maksimal {@link MAX_BULK_CERTIFICATE} data per unduhan supaya render di browser tetap aman.
 */
export const downloadGarudaCertificates = async (items: CertificateData[]) => {
  if (!items.length) {
    throw new Error('Tidak ada data yang dipilih');
  }

  if (items.length > MAX_BULK_CERTIFICATE) {
    throw new Error(`Maksimal ${MAX_BULK_CERTIFICATE} sertifikat sekali cetak`);
  }

  const [{ pdf }, { CertificateBulkDocument }] = await Promise.all([import('@react-pdf/renderer'), import('@/components/garuda/CertificateDocument')]);

  const origin = window.location.origin;
  const blob = await pdf(<CertificateBulkDocument items={items} frameSrc={`${origin}${FRAME_PATH}`} logoSrc={`${origin}${LOGO_PATH}`} />).toBlob();

  triggerDownload(blob, `Sertifikat Garuda - ${items.length} Data.pdf`);
};
