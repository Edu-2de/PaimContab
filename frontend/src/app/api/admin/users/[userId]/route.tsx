import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    console.log('Frontend: Buscando detalhes do usuário:', userId);

    // Buscar token do header Authorization
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ message: 'Token de acesso requerido', code: 'NO_TOKEN' }, { status: 401 });
    }

    const response = await fetch(`${apiUrl}/api/admin/users/${userId}`, {
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
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Frontend: Detalhes do usuário recebidos:', data.name);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Frontend: Erro na rota de detalhes do usuário:', error);
    return NextResponse.json(
      {
        message: 'Erro interno do servidor',
        error:
          typeof error === 'object' && error !== null && 'message' in error
            ? (error as { message: string }).message
            : String(error),
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    const body = await request.json();
    console.log('Frontend: Atualizando usuário:', userId);

    // Buscar token do header Authorization
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ message: 'Token de acesso requerido', code: 'NO_TOKEN' }, { status: 401 });
    }

    const response = await fetch(`${apiUrl}/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    console.log('Frontend: Status da resposta:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Frontend: Erro do backend:', errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Frontend: Usuário atualizado:', data.name);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Frontend: Erro na rota de atualização do usuário:', error);
    return NextResponse.json(
      {
        message: 'Erro interno do servidor',
        error:
          typeof error === 'object' && error !== null && 'message' in error
            ? (error as { message: string }).message
            : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    console.log('Frontend: Deletando usuário:', userId);

    // Buscar token do header Authorization
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ message: 'Token de acesso requerido', code: 'NO_TOKEN' }, { status: 401 });
    }

    const response = await fetch(`${apiUrl}/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('Frontend: Status da resposta:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Frontend: Erro do backend:', errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Frontend: Usuário deletado:', data.deletedUser?.name);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Frontend: Erro na rota de exclusão do usuário:', error);
    return NextResponse.json(
      {
        message: 'Erro interno do servidor',
        error:
          typeof error === 'object' && error !== null && 'message' in error
            ? (error as { message: string }).message
            : String(error),
      },
      { status: 500 }
    );
  }
}
