import connect from '@/lib/db';
import Member from '@/lib/modals/member';
import Tku from '@/lib/modals/tku';
import { Types } from 'mongoose';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (req: NextRequest) => {
  try {
    await connect();

    // Ambil token user
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    let memberIds: any[] = [];

    // Jika user role dan ada institution_id, dapatkan member_ids yang sesuai
    if (token && token.role === 'user' && token.institution_id) {
      const members = await Member.find({ institution_id: new Types.ObjectId(token.institution_id), is_delete: 0 }, { _id: 1 });
      memberIds = members.map((member) => member._id);

      // Jika tidak ada member yang ditemukan, return data kosong
      if (memberIds.length === 0) {
        return NextResponse.json({
          total_mula: 0,
          total_bantu: 0,
          total_tata: 0,
          total_peserta: 0,
          selesai: 0,
          dalam_proses: 0,
          belum_mulai: 0,
        });
      }
    }

    // Buat filter berdasarkan member_ids (jika ada)
    const baseFilter = memberIds.length > 0 ? { member_id: { $in: memberIds }, is_delete: 0 } : { is_delete: 0 };

    // Total peserta mula, bantu, tata (dengan filter institution)
    const total_mula = await Tku.countDocuments({ mula: true, ...baseFilter });
    const total_bantu = await Tku.countDocuments({ bantu: true, ...baseFilter });
    const total_tata = await Tku.countDocuments({ tata: true, ...baseFilter });

    // Total peserta (unik) - dengan filter institution
    const total_peserta = await Tku.countDocuments(baseFilter);

    // Status dengan filter institution
    const selesai = await Tku.countDocuments({ tata: true, ...baseFilter });
    const dalam_proses = await Tku.countDocuments({
      bantu: true,
      tata: false,
      ...baseFilter,
    });
    const belum_mulai = await Tku.countDocuments({
      mula: false,
      ...baseFilter,
    });

    const result = {
      total_mula,
      total_bantu,
      total_tata,
      total_peserta,
      selesai,
      dalam_proses,
      belum_mulai,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error fetching TKU summary:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
};
