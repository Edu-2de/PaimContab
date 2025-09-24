import { NextResponse } from 'next/server';

const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export async function POST(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    // Aguardar os params antes de usar
    const { userId } = await params;
    const body = await req.json();

    console.log('Enviando dados para:', `${apiUrl}/api/company/user/${userId}`);
    console.log('Dados:', body);

    const response = await fetch(`${apiUrl}/api/company/user/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log('Resposta do backend:', data);

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro na rota:', error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}
