import { NextRequest, NextResponse } from 'next/server';
import connect from '@/lib/db';
import Garuda from '@/lib/modals/garuda';
import Member from '@/lib/modals/member';
import ActivityLog from '@/lib/modals/logs';
import { getToken } from 'next-auth/jwt';
import Tkk from '@/lib/modals/tkk';
import Tku from '@/lib/modals/tku';
import { Types } from 'mongoose';

export async function GET(req: NextRequest) {
  await connect();
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const search = searchParams.get('search') || '';

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Pipeline untuk aggregate agar bisa search by nama member
  const initialMatchStage: any = { is_delete: 0 };

  const pipeline: any[] = [
    { $match: initialMatchStage },
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

    ...(token && token.role === 'user' && token.institution_id
      ? [
          {
            $match: {
              'member.institution_id': new Types.ObjectId(token.institution_id),
            },
          },
        ]
      : []),

    ...(search
      ? [
          {
            $match: {
              $or: [{ 'member.name': { $regex: search, $options: 'i' } }, { 'member.phone': { $regex: search, $options: 'i' } }],
            },
          },
        ]
      : []),

    {
      $sort: { createdAt: -1 },
    },
    {
      $facet: {
        data: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              member_id: {
                _id: '$member._id',
                name: '$member.name',
                nta: '$member.member_number',
              },
              level_tku: 1,
              status: 1,
              approved_by: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
        totalCount: [{ $count: 'count' }],
      },
    },
  ];

  const result = await Garuda.aggregate(pipeline);
  const data = result[0]?.data || [];
  const total = result[0]?.totalCount[0]?.count || 0;

  return NextResponse.json({
    data,
    pagination: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    },
  });
}

export const POST = async (req: NextRequest) => {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const user_id = token.id;

    await connect();
    const body = await req.json();
    const { member_id } = body;

    // --- VALIDATION ---
    // Ambil data member
    let memberList = await Member.findOne({ _id: member_id, is_delete: 0 }).lean();
    if (Array.isArray(memberList)) memberList = memberList[0];
    if (!memberList) {
      return new NextResponse('Member not found', { status: 404 });
    }

    const tkks = await Tkk.find({ member_id: member_id, is_delete: 0 }).lean();
    const tku = await Tku.find({ member_id: member_id, is_delete: 0 }).lean();

    let levelTku = '';
    if (Array.isArray(tku) && tku.length > 0) {
      const tkuItem = tku[0];
      if (tkuItem.tata) levelTku = 'TATA';
      else if (tkuItem.bantu) levelTku = 'BANTU';
      else if (tkuItem.mula) levelTku = 'MULA';
    }

    // Hitung jumlah TKK per bidang untuk masing-masing tingkat
    const bidangTkk: Record<string, number> = {};
    tkks.forEach((tkk) => {
      const key = String(tkk.type_tkk_id);
      bidangTkk[key] = (bidangTkk[key] || 0) + 1;
    });

    // Syarat: TKU Tata, 4 TKK (masing-masing bidang berbeda)
    const bidangKurangPurwa = Object.values(bidangTkk).filter((count) => count < 4).length > 0 || Object.keys(bidangTkk).length === 0;

    if (levelTku !== 'TATA' || bidangKurangPurwa) {
      return new NextResponse(
        JSON.stringify({
          message: 'Syarat tidak terpenuhi: TKU harus Tata, 4 TKK per bidang',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // --- END VALIDATION ---
    // Cek jika member_id sudah ada di Garuda
    const existingGaruda = await Garuda.findOne({ member_id: member_id });
    if (existingGaruda) {
      return new NextResponse(JSON.stringify({ message: 'Member ini sudah terdaftar di data Garuda.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Set jumlah TKK sesuai syarat baru
    const newGaruda = new Garuda({ member_id: member_id, level_tku: levelTku, total_tkk: tkks.length, status: 0 });
    await newGaruda.save();
    await newGaruda.populate({ path: 'member_id', select: 'name nta', model: Member });

    // Log activity
    await ActivityLog.create({
      user_id: user_id,
      action: 'create',
      description: `Menambahkan data Garuda untuk user ${newGaruda.user_id?.name || ''}`,
      module: 'Garuda',
    });

    return new NextResponse(JSON.stringify({ message: 'Garuda created successfully', data: newGaruda.toObject() }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Error creating Garuda:', error);
    return new NextResponse('Internal Server Error: ' + error.message, { status: 500 });
  }
};
