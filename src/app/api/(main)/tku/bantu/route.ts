import connect from '@/lib/db';
import Tku from '@/lib/modals/tku';
import { NextRequest, NextResponse } from 'next/server';
import '@/lib/modals/institution';
import '@/lib/modals/member';
import { getToken } from 'next-auth/jwt';
import { Types } from 'mongoose';
import Member from '@/lib/modals/member';
import moment from 'moment';

export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    if (page < 1 || limit < 1) {
      return new NextResponse('Invalid page or limit', { status: 400 });
    }

    await connect();

    // Ambil token user
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    // Filter awal hanya untuk mula
    const initialMatchStage: any = { bantu: true, is_delete: 0 };

    const pipeline = [
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
        $lookup: {
          from: 'institutions',
          localField: 'member.institution_id',
          foreignField: '_id',
          as: 'institution',
        },
      },
      { $unwind: { path: '$institution', preserveNullAndEmptyArrays: true } },

      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                member_id: 1,
                mula: 1,
                bantu: 1,
                tata: 1,
                sk_mula: 1,
                sk_bantu: 1,
                sk_tata: 1,
                date_mula: 1,
                date_bantu: 1,
                date_tata: 1,
                createdAt: 1,
                updatedAt: 1,
                'member.name': 1,
                'member.member_number': 1,
                'member.phone': 1,
                'institution.name': 1,
                'institution._id': 1,
              },
            },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    ];

    const result = await Tku.aggregate(pipeline);

    const data = result[0]?.data || [];
    const totalCountArray = result[0]?.totalCount || [];
    const total_data = totalCountArray.length > 0 ? totalCountArray[0].count : 0;

    const responsePayload = {
      data,
      pagination: {
        total_data,
        page,
        limit,
        total_pages: Math.ceil(total_data / limit),
      },
    };

    return new NextResponse(JSON.stringify(responsePayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error fetching data:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
};

export const POST = async (req: Request) => {
  try {
    await connect();

    const body = await req.json();
    const { id } = body;

    // Ambil data Tku dan member
    const existingData = await Tku.findOne({ _id: id, is_delete: 0 }).populate({ path: 'member_id', populate: { path: 'institution_id' } });
    if (!existingData || !existingData.mula) {
      return new NextResponse('Member not found or not eligible for Bantu', { status: 404 });
    }
    if (existingData.bantu) {
      return new NextResponse('Member already has Bantu data', { status: 400 });
    }

    // Validasi jarak minimal 100 hari antara date_mula dan tanggal input bantu menggunakan moment.js
    const now = moment();
    const dateMula = existingData.date_mula ? moment(existingData.date_mula) : null;
    if (!dateMula) {
      return new NextResponse('Tanggal Mula tidak ditemukan', { status: 400 });
    }
    const diffDays = now.diff(dateMula, 'days');
    if (diffDays < 100) {
      return new NextResponse('Jarak antara tanggal Mula dan Bantu minimal 100 hari', { status: 400 });
    }

    // Ambil nomor urut SK
    const lastTku = await Tku.findOne({ bantu: true }, {}, { sort: { createdAt: -1 } });
    let nomorUrut = 1;
    if (lastTku && lastTku.sk_bantu) {
      const match = lastTku.sk_bantu.match(/^(\d{5})/);
      if (match) {
        nomorUrut = parseInt(match[1], 10) + 1;
      }
    }
    const nomorUrutStr = nomorUrut.toString().padStart(5, '0');

    // Format SK: nomor_urut_5_digit/TKU-BANTU/gudep-A/tahun
    const tahun = new Date().getFullYear();
    let gudep = '';
    const member = existingData.member_id;
    const institution = member?.institution_id;
    if (member?.gender === 'Laki-Laki') {
      gudep = institution?.gudep_man || '';
    } else if (member?.gender === 'Perempuan') {
      gudep = institution?.gudep_woman || '';
    } else {
      gudep = institution?.gudep_man || '';
    }
    const sk_bantu = `${nomorUrutStr}/TKU-BANTU/${gudep}-A/${tahun}`;
    const date_bantu = now.format('YYYY-MM-DD');

    const updatedData = await Tku.findByIdAndUpdate(id, { sk_bantu, date_bantu, bantu: true }, { new: true });

    return new NextResponse(JSON.stringify({ message: 'Data updated successfully', data: updatedData.toObject() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating data:', error);
    return new NextResponse('Internal Server Error' + error.message, { status: 500 });
  }
};