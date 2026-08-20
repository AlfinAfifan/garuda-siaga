import { Schema, model, models } from 'mongoose';

/**
 * Penyimpan nomor urut yang dipakai lintas modul (mis. nomor sertifikat Garuda per tahun).
 * Increment dilakukan lewat findOneAndUpdate + $inc supaya aman dari race condition.
 */
const counterSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Counter = models.Counter || model('Counter', counterSchema);

export default Counter;
