/**
 * Mengisi nomor sertifikat untuk data Garuda yang sudah di-approve sebelum fitur nomor sertifikat ada.
 *
 * Nomor diberikan per tahun (mengikuti tahun approved_at, fallback updatedAt/createdAt),
 * diurutkan dari yang paling lama di-approve, dan melanjutkan nomor yang sudah terpakai di tahun itu.
 * Counter di collection `counters` ikut disetel supaya approve berikutnya tidak menabrak nomor lama.
 *
 * Jalankan dry-run dulu untuk melihat apa yang akan diubah:
 *   node --env-file=.env scripts/backfill-garuda-certificate-number.mjs
 *
 * Baru eksekusi setelah hasilnya sesuai:
 *   node --env-file=.env scripts/backfill-garuda-certificate-number.mjs --apply
 */
import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/garuda-scout';

await mongoose.connect(MONGODB_URI, { dbName: 'garuda-scout' });

const garudas = mongoose.connection.collection('garudas');
const counters = mongoose.connection.collection('counters');

const yearOf = (doc) => new Date(doc.approved_at || doc.updatedAt || doc.createdAt).getFullYear();

const pending = await garudas
  .find({
    status: 1,
    is_delete: 0,
    $or: [{ certificate_number: null }, { certificate_number: { $exists: false } }],
  })
  .sort({ approved_at: 1, updatedAt: 1, createdAt: 1 })
  .toArray();

if (pending.length === 0) {
  console.log('Tidak ada data Garuda approved yang perlu diisi nomor sertifikatnya.');
  await mongoose.disconnect();
  process.exit(0);
}

// Nomor terakhir yang sudah terpakai per tahun, supaya backfill melanjutkan, bukan menimpa
const usedPerYear = new Map();
const existing = await garudas.find({ certificate_number: { $ne: null }, certificate_year: { $ne: null } }).toArray();
existing.forEach((doc) => {
  const current = usedPerYear.get(doc.certificate_year) || 0;
  if (doc.certificate_number > current) usedPerYear.set(doc.certificate_year, doc.certificate_number);
});

const updates = pending.map((doc) => {
  const year = yearOf(doc);
  const next = (usedPerYear.get(year) || 0) + 1;
  usedPerYear.set(year, next);
  return { _id: doc._id, year, number: next };
});

updates.forEach((item) => {
  console.log(`${item._id} -> ${String(item.number).padStart(4, '0')}/SPG/1303-A/${item.year}`);
});
console.log(`\nTotal: ${updates.length} data Garuda`);
usedPerYear.forEach((seq, year) => console.log(`Counter garuda_certificate_${year} -> ${seq}`));

if (!APPLY) {
  console.log('\nDry-run. Tambahkan --apply untuk mengeksekusi.');
  await mongoose.disconnect();
  process.exit(0);
}

for (const item of updates) {
  await garudas.updateOne({ _id: item._id }, { $set: { certificate_number: item.number, certificate_year: item.year } });
}

for (const [year, seq] of usedPerYear) {
  const key = `garuda_certificate_${year}`;
  const counter = await counters.findOne({ key });
  if (!counter || counter.seq < seq) {
    await counters.updateOne({ key }, { $set: { seq }, $setOnInsert: { key, createdAt: new Date() }, $currentDate: { updatedAt: true } }, { upsert: true });
  }
}

console.log('\nSelesai.');
await mongoose.disconnect();
