'use client';

import type { CertificateData } from '@/components/garuda/CertificateDocument';

const FRAME_PATH = '/image/bingkai.png';
const LOGO_PATH = '/image/logo.png';

const sanitizeFileName = (value: string) => value.replace(/[\\/:*?"<>|]/g, '').trim() || 'Sertifikat';

/**
 * Merender sertifikat Garuda ke PDF lalu mengunduhnya.
 * Library PDF di-import dinamis supaya tidak ikut bundle awal halaman.
 */
export const downloadGarudaCertificate = async (data: CertificateData) => {
  const [{ pdf }, { CertificateDocument }] = await Promise.all([import('@react-pdf/renderer'), import('@/components/garuda/CertificateDocument')]);

  const origin = window.location.origin;
  const blob = await pdf(<CertificateDocument data={data} frameSrc={`${origin}${FRAME_PATH}`} logoSrc={`${origin}${LOGO_PATH}`} />).toBlob();

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Sertifikat Garuda - ${sanitizeFileName(data.name)}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
