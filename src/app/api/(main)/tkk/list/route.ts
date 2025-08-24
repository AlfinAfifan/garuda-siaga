import connect from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import '@/lib/modals/institution';
import '@/lib/modals/member';
import Tkk from '@/lib/modals/tkk';
import Tku from '@/lib/modals/tku';
import { getToken } from 'next-auth/jwt';
import { Types } from 'mongoose';

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

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    const pipeline = [
      // Lookup member terlebih dahulu
      {
        $lookup: {
          from: 'members',
          localField: 'member_id',
          foreignField: '_id',
          as: 'member',
        },
      },
      { $unwind: '$member' },

      // Filter berdasarkan institution_id setelah member sudah di-lookup
      ...(token && token.role === 'user' && token.institution_id
        ? [
            {
              $match: {
                'member.institution_id': new Types.ObjectId(token.institution_id),
              },
            },
          ]
        : []),

      // Lookup type_tkk
      {
        $lookup: {
          from: 'typetkks',
          localField: 'type_tkk_id',
          foreignField: '_id',
          as: 'type_tkk',
        },
      },
      { $unwind: '$type_tkk' },

      // Filter search setelah semua lookup selesai
      ...(search
        ? [
            {
              $match: {
                $or: [{ 'member.name': { $regex: search, $options: 'i' } }, { 'member.phone': { $regex: search, $options: 'i' } }],
              },
            },
          ]
        : []),

      // Lookup institution
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
              },
            },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    ];

    const result = await Tkk.aggregate(pipeline);

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
    console.error('Error fetching data:', error);

    return new NextResponse('Internal Server Error', { status: 500 });
  }
};

export const POST = async (req: Request) => {
  try {
    await connect();

    const body = await req.json();
    const { member_id, type_tkk_id, examiner_name, examiner_position, examiner_address } = body;

    const dataTku = await Tku.findOne({ member_id, mula: true }).populate({ path: 'member_id', populate: { path: 'institution_id' } });
    if (!dataTku.bantu || !dataTku.mula) {
      return new NextResponse('Bantu and Mula data must be completed before creating TKK', { status: 400 });
    }

    // Ambil nomor urut SK
    const lastTkk = await Tkk.findOne({}, { sort: { createdAt: -1 } });
    let nomorUrut = 1;
    if (lastTkk && lastTkk.sk) {
      const match = lastTkk.sk.match(/^(\d{5})/);
      if (match) {
        nomorUrut = parseInt(match[1], 10) + 1;
      }
    }
    const nomorUrutStr = nomorUrut.toString().padStart(5, '0');

    // Format SK: nomor_urut_5_digit/TKK-SIAGA/gudep-A/tahun
    const tahun = new Date().getFullYear();
    let gudep = '';
    const member = dataTku.member_id;
    const institution = member?.institution_id;
    if (member?.gender === 'Laki-Laki') {
      gudep = institution?.gudep_man || '';
    } else if (member?.gender === 'Perempuan') {
      gudep = institution?.gudep_woman || '';
    } else {
      gudep = institution?.gudep_man || '';
    }
    const sk = `${nomorUrutStr}/TKK-SIAGA/${gudep}-A/${tahun}`;
    const date = new Date().toISOString().split('T')[0];

    const newData = new Tkk({ member_id, type_tkk_id, sk, date, examiner_name, examiner_position, examiner_address });
    await newData.save();

    return new NextResponse(JSON.stringify({ message: 'Data created successfully', data: newData.toObject() }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating data:', error);
    return new NextResponse('Internal Server Error' + error.message, { status: 500 });
  }
};
