import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';

    console.log('Frontend: Buscando usuários com parâmetros:', { page, limit, search });

    // Buscar token do header Authorization
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ message: 'Token de acesso requerido', code: 'NO_TOKEN' }, { status: 401 });
    }

    const url = `${apiUrl}/api/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
    console.log('Frontend: URL completa:', url);

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    console.log('Frontend: Status da resposta:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Frontend: Erro do backend:', errorText);
      return NextResponse.json(JSON.parse(errorText), { status: response.status });
    }

    const data = await response.json();
    console.log('Frontend: Dados dos usuários recebidos:', data.users?.length, 'usuários');
    return NextResponse.json(data);
  } catch (error) {
    console.error('Frontend: Erro na rota de usuários:', error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}
