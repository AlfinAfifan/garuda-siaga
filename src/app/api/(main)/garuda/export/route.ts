import { NextRequest, NextResponse } from 'next/server';
import connect from '@/lib/db';
import Garuda from '@/lib/modals/garuda';
import { getToken } from 'next-auth/jwt';
import { garudaFilterStages, garudaProjectStage } from '@/lib/garuda-pipeline';

// Semua data garuda sesuai filter halaman, tanpa pagination, untuk diunduh sebagai Excel
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await connect();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const institutionId = searchParams.get('institution_id') || '';

    const data = await Garuda.aggregate([...garudaFilterStages(token, search, institutionId), { $sort: { createdAt: -1 } }, garudaProjectStage]);

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error exporting garuda:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
