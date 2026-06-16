// app/api/verify-token/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    // Logika sementara: Token yang benar adalah "MOBFT26"
    if (token === 'MOBFT26') {
      return NextResponse.json({ success: true, message: 'Token Valid' });
    } else {
      return NextResponse.json(
        { success: false, message: 'Token Salah atau Tidak Ditemukan' },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}