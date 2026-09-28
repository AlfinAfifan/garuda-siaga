import { Types } from 'mongoose';
import { JWT } from 'next-auth/jwt';

// Filter bersama untuk list, export, dan summary Garuda supaya hasilnya selalu sama
export const garudaFilterStages = (token: JWT | null, search: string, institutionId: string): any[] => [
  { $match: { is_delete: 0 } },
  { $lookup: { from: 'members', localField: 'member_id', foreignField: '_id', as: 'member' } },
  { $unwind: '$member' },
  { $match: { 'member.is_delete': 0 } },
  { $lookup: { from: 'institutions', localField: 'member.institution_id', foreignField: '_id', as: 'institution' } },
  { $unwind: { path: '$institution', preserveNullAndEmptyArrays: true } },
  { $match: { 'institution.is_delete': 0 } },
  // Kalau sub_district / institution_id kosong, jangan tampilkan apa-apa (bukan semua data)
  ...(token?.role === 'admin_kecamatan' ? [{ $match: token.sub_district ? { 'institution.sub_district': token.sub_district } : { _id: null } }] : []),
  ...(token?.role === 'user' ? [{ $match: token.institution_id ? { 'member.institution_id': new Types.ObjectId(token.institution_id) } : { _id: null } }] : []),
  ...(institutionId && Types.ObjectId.isValid(institutionId) ? [{ $match: { 'member.institution_id': new Types.ObjectId(institutionId) } }] : []),
  ...(search
    ? [
        {
          $match: {
            $or: [
              { 'member.name': { $regex: search, $options: 'i' } },
              { 'member.phone': { $regex: search, $options: 'i' } },
              { 'institution.name': { $regex: search, $options: 'i' } },
            ],
          },
        },
      ]
    : []),
];

export const garudaProjectStage = {
  $project: {
    _id: 1,
    member_id: {
      _id: '$member._id',
      name: '$member.name',
      nta: '$member.member_number',
      // Data tambahan yang dicetak pada surat ketetapan
      gender: '$member.gender',
      birth_place: '$member.birth_place',
      birth_date: '$member.birth_date',
      religion: '$member.religion',
      rt: '$member.rt',
      rw: '$member.rw',
      village: '$member.village',
      sub_district: '$member.sub_district',
      district: '$member.district',
      province: '$member.province',
    },
    institution: {
      _id: '$institution._id',
      name: '$institution.name',
      sub_district: '$institution.sub_district',
      // Alamat & nomor gugus depan dipakai pada surat ketetapan
      address: '$institution.address',
      gudep_man: '$institution.gudep_man',
      gudep_woman: '$institution.gudep_woman',
      head_gudep_man: '$institution.head_gudep_man',
      head_gudep_woman: '$institution.head_gudep_woman',
    },
    level_tku: 1,
    total_tkk: 1,
    status: 1,
    approved_by: 1,
    approved_at: 1,
    certificate_number: 1,
    certificate_year: 1,
    createdAt: 1,
    updatedAt: 1,
  },
};
