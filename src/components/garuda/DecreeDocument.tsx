'use client';

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { formatCertificateNumber, formatIndonesianDate } from './CertificateDocument';

// Matikan hyphenation bawaan react-pdf supaya kata tidak terpotong (mis. "Pra-muka")
Font.registerHyphenationCallback((word) => [word]);

// Data kwartir yang tercetak di surat ketetapan, ubah di sini bila ada pergantian
export const DECREE_CONFIG = {
  city: 'Trenggalek',
  kwarcab: 'Kwartir Cabang Gerakan Pramuka Trenggalek',
  position: 'Ketua Harian',
  signer_name: 'MAHSUN ISMA’IL, S.Ag, MM',
  number_suffix: '13.03 – B',
  level: 'Siaga',
};

export type DecreeData = {
  name: string;
  birth_place?: string | null;
  birth_date?: string | Date | null;
  religion?: string | null;
  gender?: string | null;
  /** Alamat rumah anggota, sudah digabung jadi satu kalimat */
  address?: string | null;
  /** Nama pangkalan (institution.name) */
  institution: string;
  /** Nomor gugus depan sesuai jenis kelamin (gudep putra / putri) */
  gudep_number?: string | null;
  /** Alamat gugus depan (institution.address) */
  gudep_address?: string | null;
  date: string | Date | null;
  /** Nomor urut ketetapan, dicetak 4 karakter (mis. 0001) */
  number?: number | null;
  /** Tahun pada nomor ketetapan, default mengikuti tanggal approve */
  year?: number | null;
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: '#000000',
    paddingTop: 48,
    paddingBottom: 40,
    paddingHorizontal: 60,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    textDecoration: 'underline',
  },
  number: {
    marginTop: 6,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  kwarcab: {
    marginTop: 14,
    textAlign: 'center',
  },
  assign: {
    marginTop: 12,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  identity: {
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  label: {
    width: 120,
  },
  colon: {
    width: 8,
  },
  value: {
    flex: 1,
    lineHeight: 1.3,
  },
  as: {
    marginTop: 10,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  award: {
    marginTop: 8,
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  description: {
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 1.4,
  },
  date: {
    marginTop: 18,
    textAlign: 'center',
  },
  signatureBlock: {
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 1.3,
  },
  signerName: {
    marginTop: 50,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    textDecoration: 'underline',
  },
});

/** Baris identitas dengan format "Label : Nilai" */
const IdentityRow = ({ label, value }: { label: string; value?: string | null }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.colon}>:</Text>
    <Text style={styles.value}>{value || '-'}</Text>
  </View>
);

/** Satu halaman ketetapan, dipakai ulang untuk unduhan satuan maupun massal. */
const DecreePage = ({ data }: { data: DecreeData }) => {
  const year = data.year ?? (data.date ? new Date(data.date).getFullYear() : new Date().getFullYear());
  const number = formatCertificateNumber(data.number);
  const birth = data.birth_place ? `${data.birth_place}, ${formatIndonesianDate(data.birth_date ?? null)}` : formatIndonesianDate(data.birth_date ?? null);

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>K E T E T A P A N</Text>
      <Text style={styles.number}>{`Nomor : ${number}/${DECREE_CONFIG.number_suffix}/${year}`}</Text>

      <Text style={styles.kwarcab}>{`${DECREE_CONFIG.kwarcab}.`}</Text>
      <Text style={styles.assign}>Menetapkan:</Text>

      <View style={styles.identity}>
        <IdentityRow label="Nama" value={data.name?.toUpperCase()} />
        <IdentityRow label="Tempat Tanggal Lahir" value={birth} />
        <IdentityRow label="Agama" value={data.religion} />
        <IdentityRow label="Jenis Kelamin" value={data.gender} />
        <IdentityRow label="Alamat Rumah" value={data.address} />
        <IdentityRow label="Pangkalan" value={data.institution} />
        <IdentityRow label="Nomor Gugus Depan" value={data.gudep_number} />
        <IdentityRow label="Alamat Gugus Depan" value={data.gudep_address} />
        <IdentityRow label="Golongan" value={DECREE_CONFIG.level} />
      </View>

      <Text style={styles.as}>Sebagai:</Text>
      <Text style={styles.award}>PRAMUKA SIAGA GARUDA</Text>

      <Text style={styles.description}>Semoga yang bersangkutan tetap akan melanjutkan menjadi Pramuka Penggalang dan dapat mempersiapkan diri membangun masyarakat.</Text>

      <Text style={styles.date}>{`${DECREE_CONFIG.city}, ${formatIndonesianDate(data.date)}`}</Text>

      <View style={styles.signatureBlock}>
        <Text>Yang Menyematkan,</Text>
        <Text>{DECREE_CONFIG.kwarcab}</Text>
        <Text>{DECREE_CONFIG.position}</Text>
      </View>

      <Text style={styles.signerName}>{DECREE_CONFIG.signer_name}</Text>
    </Page>
  );
};

export const DecreeDocument = ({ data }: { data: DecreeData }) => (
  <Document title={`Surat Ketetapan Pramuka Siaga Garuda - ${data.name}`} author={DECREE_CONFIG.kwarcab}>
    <DecreePage data={data} />
  </Document>
);

/** Beberapa ketetapan digabung jadi satu file PDF, satu halaman per anggota. */
export const DecreeBulkDocument = ({ items }: { items: DecreeData[] }) => (
  <Document title={`Surat Ketetapan Pramuka Siaga Garuda (${items.length} data)`} author={DECREE_CONFIG.kwarcab}>
    {items.map((item, index) => (
      <DecreePage key={`${item.name}-${index}`} data={item} />
    ))}
  </Document>
);

export default DecreeDocument;
