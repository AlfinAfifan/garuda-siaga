/**
 * Membersihkan TKK duplikat (member_id + type_tkk_id yang sama) sebelum unique index dibentuk.
 *
 * Yang dipertahankan: record yang punya sk terisi; jika tidak ada, yang paling lama dibuat.
 * Sisanya di-soft-delete (is_delete: 1), bukan dihapus permanen, supaya masih bisa ditelusuri.
 *
 * Jalankan dry-run dulu untuk melihat apa yang akan diubah:
 *   node --env-file=.env scripts/cleanup-duplicate-tkk.mjs
 *
 * Baru eksekusi setelah hasilnya sesuai:
 *   node --env-file=.env scripts/cleanup-duplicate-tkk.mjs --apply
 */
import mongoose from 'mongoose';

const APPLY = process.argv.includes('--apply');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/garuda-scout';

await mongoose.connect(MONGODB_URI, { dbName: 'garuda-scout' });

const tkks = mongoose.connection.collection('tkks');

const duplicates = await tkks
  .aggregate([
    { $match: { is_delete: 0 } },
    {
      $group: {
        _id: { member_id: '$member_id', type_tkk_id: '$type_tkk_id' },
        docs: { $push: { _id: '$_id', sk: '$sk', createdAt: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ])
  .toArray();

if (duplicates.length === 0) {
  console.log('Tidak ada TKK duplikat. Unique index aman dibentuk.');
  await mongoose.disconnect();
  process.exit(0);
}

const toDelete = [];

for (const group of duplicates) {
  const sorted = [...group.docs].sort((a, b) => {
    const aHasSk = a.sk ? 1 : 0;
    const bHasSk = b.sk ? 1 : 0;
    if (aHasSk !== bHasSk) return bHasSk - aHasSk;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  const [keep, ...remove] = sorted;
  console.log(`member ${group._id.member_id} / type ${group._id.type_tkk_id}: ${group.count} record`);
  console.log(`  simpan  ${keep._id} (sk: "${keep.sk || ''}")`);
  for (const doc of remove) {
    console.log(`  hapus   ${doc._id} (sk: "${doc.sk || ''}")`);
    toDelete.push(doc._id);
  }
}

console.log(`\nTotal ${duplicates.length} grup duplikat, ${toDelete.length} record akan di-soft-delete.`);

if (!APPLY) {
  console.log('Dry-run — tidak ada perubahan. Tambahkan --apply untuk mengeksekusi.');
} else {
  const result = await tkks.updateMany({ _id: { $in: toDelete } }, { $set: { is_delete: 1 } });
  console.log(`Selesai: ${result.modifiedCount} record di-soft-delete.`);
}

await mongoose.disconnect();
