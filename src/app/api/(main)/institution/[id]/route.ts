import connect from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import Institution from '@/lib/modals/institution';
import { getToken } from 'next-auth/jwt';
import ActivityLog from '@/lib/modals/logs';

export const GET = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;

    if (!id || !Types.ObjectId.isValid(id)) {
      return new NextResponse('Invalid institution ID', { status: 400 });
    }

    // Connect to the database
    await connect();

    // Fetch institution by ID from the database
    const institution = await Institution.findOne({ _id: id, is_delete: 0 }).lean();

    if (!institution) {
      return new NextResponse('Institution not found', { status: 404 });
    }

    // Return the institution as JSON response
    return new NextResponse(JSON.stringify(institution), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching institution:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
};

export const PATCH = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check permission
    if (!(token.role === 'super_admin' || token.role === 'admin' || token.role === 'admin_kecamatan')) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const user_id = token.id;
    const { id } = await params;

    // Parse the request body
    const body = await req.json();
    const { name, address, gudep_man, gudep_woman, head_gudep_man, head_gudep_woman, nta_head_gudep_man, nta_head_gudep_woman, headmaster_name, headmaster_number } = body;
    let { sub_district } = body;

    if (!id || !Types.ObjectId.isValid(id)) {
      return new NextResponse('Invalid institution ID', { status: 400 });
    }

    // Connect to the database
    await connect();

    // Untuk admin_kecamatan, validasi bahwa institution yang akan diupdate ada di sub_district mereka
    if (token.role === 'admin_kecamatan') {
      const existingInstitution = await Institution.findOne({ _id: id, is_delete: 0 });
      if (!existingInstitution) {
        return new NextResponse('Institution not found', { status: 404 });
      }

      // Cek apakah institution di sub_district yang sama
      if (existingInstitution.sub_district !== token.sub_district) {
        return new NextResponse('Forbidden: You can only update institutions in your sub_district', { status: 403 });
      }

      // Force sub_district sesuai dengan sub_district user
      sub_district = token.sub_district || sub_district;
    }

    // Find the institution by ID and update
    const updatedInstitution = await Institution.findByIdAndUpdate(
      id,
      { name, sub_district, address, gudep_man, gudep_woman, head_gudep_man, head_gudep_woman, nta_head_gudep_man, nta_head_gudep_woman, headmaster_name, headmaster_number },
      { new: true, runValidators: true }
    );

    if (!updatedInstitution) {
      return new NextResponse('Institution not found', { status: 404 });
    }

    await ActivityLog.create({
      user_id: user_id,
      action: 'update',
      description: `Mengupdate institusi dengan nama ${name}`,
      module: 'Institution',
    });

    // Return the updated institution
    return new NextResponse(JSON.stringify(updatedInstitution), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating institution:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
};

export const DELETE = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check permission
    if (!(token.role === 'super_admin' || token.role === 'admin' || token.role === 'admin_kecamatan')) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const user_id = token.id;
    const { id } = await params;

    if (!id || !Types.ObjectId.isValid(id)) {
      return new NextResponse('Invalid institution ID', { status: 400 });
    }

    // Connect to the database
    await connect();

    // Untuk admin_kecamatan, validasi bahwa institution yang akan dihapus ada di sub_district mereka
    if (token.role === 'admin_kecamatan') {
      const existingInstitution = await Institution.findOne({ _id: id, is_delete: 0 });
      if (!existingInstitution) {
        return new NextResponse('Institution not found', { status: 404 });
      }

      // Cek apakah institution di sub_district yang sama
      if (existingInstitution.sub_district !== token.sub_district) {
        return new NextResponse('Forbidden: You can only delete institutions in your sub_district', { status: 403 });
      }
    }

    // Find the institution by ID and soft delete (set is_delete = 1)
    const deletedInstitution = await Institution.findByIdAndUpdate(id, { is_delete: 1 }, { new: true });

    if (!deletedInstitution) {
      return new NextResponse('Institution not found', { status: 404 });
    }

    await ActivityLog.create({
      user_id: user_id,
      action: 'delete',
      description: `Menghapus institusi dengan nama ${deletedInstitution.name}`,
      module: 'Institution',
    });

    // Return success message
    return new NextResponse(JSON.stringify({ message: 'Institution deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting institution:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
};
