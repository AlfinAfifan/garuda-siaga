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
    if (!(token && (token.role === 'super_admin' || token.role === 'admin'))) {
      if (!institution_id) {
        return new NextResponse('institution_id is required', { status: 400 });
      }
      matchStage = { 'member.institution_id': new Types.ObjectId(institution_id) };
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
          from: 'institutions',
          localField: 'member.institution_id',
          foreignField: '_id',
          as: 'institution',
        },
      },
      { $unwind: { path: '$institution', preserveNullAndEmptyArrays: true } },
      // Filter institution yang tidak terhapus
      { $match: { 'institution.is_delete': 0 } },
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $project: {
          _id: 1,
          member_name: '$member.name',
          member_number: '$member.member_number',
          institution_name: '$institution.name',
          institution_id: '$institution._id',
          type_tkk_id: 1,
          sk: 1,
          date: 1,
          examiner_name: 1,
          examiner_position: 1,
          examiner_address: 1,
          createdAt: 1,
          updatedAt: 1,
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
