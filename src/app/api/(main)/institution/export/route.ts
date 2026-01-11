import connect from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import Institution from '@/lib/modals/institution';
import { getToken } from 'next-auth/jwt';

export const GET = async (req: NextRequest) => {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!(token && (token.role === 'super_admin' || token.role === 'admin' || token.role === 'admin_kecamatan'))) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    await connect();

    // Build filter based on role
    const filter: any = { is_delete: 0 };

    // Filter untuk admin_kecamatan
    if (token.role === 'admin_kecamatan' && token.sub_district) {
      filter.sub_district = token.sub_district;
    }

    const data = await Institution.find(filter).lean();
    return new NextResponse(JSON.stringify({ data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error exporting institution data:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
};
