import { NextResponse } from 'next/server';

const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Frontend Payment: Dados recebidos:', body);

    const authHeader = request.headers.get('authorization');
    console.log('Frontend Payment: Auth header:', authHeader ? 'presente' : 'ausente');

    if (!authHeader) {
      return NextResponse.json({ message: 'Token de acesso requerido', code: 'NO_TOKEN' }, { status: 401 });
    }

    const response = await fetch(`${apiUrl}/api/payment/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    console.log('Frontend Payment: Status do backend:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('Frontend Payment: Erro do backend:', errorData);
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    console.log('Frontend Payment: Sucesso:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Frontend Payment: Erro:', error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}
