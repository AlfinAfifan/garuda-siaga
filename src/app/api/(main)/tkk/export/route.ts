import connect from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import Tkk from '@/lib/modals/tkk';
import { Types } from 'mongoose';

export const GET = async (req: NextRequest) => {
  try {
    await connect();
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const institution_id = token?.institution_id;

    // Build match stage
    let matchStage = {};
    let institutionMatchStage: any = { 'institution.is_delete': 0 };

    if (!(token && (token.role === 'super_admin' || token.role === 'admin' || token.role === 'admin_kecamatan'))) {
      if (!institution_id) {
        return new NextResponse('institution_id is required', { status: 400 });
      }
      matchStage = { 'member.institution_id': new Types.ObjectId(institution_id) };
    }

    // Untuk admin_kecamatan, filter berdasarkan sub_district dari institution
    if (token && token.role === 'admin_kecamatan' && token.sub_district) {
      institutionMatchStage = {
        'institution.is_delete': 0,
        'institution.sub_district': token.sub_district,
      };
    }

    const pipeline = [
      // Filter data yang tidak terhapus dari awal
      { $match: { is_delete: 0 } },
      {
        $lookup: {
          from: 'members',
          localField: 'member_id',
          foreignField: '_id',
          as: 'member',
        },
      },
      { $unwind: '$member' },
      // Filter member yang tidak terhapus
      { $match: { 'member.is_delete': 0 } },
      {
        $lookup: {
          from: 'typetkks',
          localField: 'type_tkk_id',
          foreignField: '_id',
          as: 'type_tkk',
        },
      },
      { $unwind: '$type_tkk' },
      // Filter type TKK yang tidak terhapus
      { $match: { 'type_tkk.is_delete': 0 } },
      {
        $lookup: {
          from: 'institutions',
          localField: 'member.institution_id',
          foreignField: '_id',
          as: 'institution',
        },
      },
      { $unwind: { path: '$institution', preserveNullAndEmptyArrays: true } },
      // Filter institution yang tidak terhapus dan sesuai sub_district (jika admin_kecamatan)
      { $match: institutionMatchStage },
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $project: {
          _id: 1,
          sk: 1,
          member_id: 1,
          date: 1,
          examiner_name: 1,
          examiner_position: 1,
          examiner_address: 1,
          createdAt: 1,
          updatedAt: 1,
          'member.name': 1,
          'member.member_number': 1,
          'member.phone': 1,
          'institution.name': 1,
          'institution._id': 1,
          'type_tkk._id': 1,
          'type_tkk.name': 1,
          'type_tkk.color': 1,
        },
      },
    ];

    const data = await Tkk.aggregate(pipeline);

    return new NextResponse(JSON.stringify({ data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error exporting TKK data:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
};
