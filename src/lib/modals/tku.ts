import { Schema, model, models } from 'mongoose';

const tkuSchema = new Schema(
  {
    member_id: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },
    mula: {
      type: Boolean,
      default: false,
    },
    bantu: {
      type: Boolean,
      default: false,
    },
    tata: {
      type: Boolean,
      default: false,
    },
    sk_mula: {
      type: String,
    },
    sk_bantu: {
      type: String,
    },
    sk_tata: {
      type: String,
    },
    date_mula: {
      type: Date,
      default: null,
    },
    date_bantu: {
      type: Date,
      default: null,
    },
    date_tata: {
      type: Date,
      default: null,
    },
    is_delete: {
      type: Number, // 0: not deleted, 1: deleted
      enum: [0, 1], 
      default: 0,
    }
  },
  {
    timestamps: true,
  }
);

const Tku = models.Tku || model('Tku', tkuSchema);

export default Tku;
