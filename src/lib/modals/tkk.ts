import { Schema, model, models } from 'mongoose';

const tkkSchema = new Schema(
  {
    member_id: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },
    type_tkk_id: {
      type: Schema.Types.ObjectId,
      ref: 'TypeTkk',
      required: true,
    },
    sk: {
      type: String,
    },
    date: {
      type: Date,
      default: null,
    },
    examiner_name: {
      type: String,
    },
    examiner_position: {
      type: String,
    },
    examiner_address: {
      type: String,
    },
    is_delete: {
      type: Number, // 0: not deleted, 1: deleted
      enum: [0, 1],
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Tkk = models.Tkk || model('Tkk', tkkSchema);

export default Tkk;
