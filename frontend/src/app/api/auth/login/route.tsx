import { NextResponse } from "next/server";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Frontend: Tentativa de login:', body.email);
    
    const response = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.log('Frontend: Erro no login:', data);
      return NextResponse.json(data, { status: response.status });
    }

    console.log('Frontend: Login bem-sucedido:', data.user?.name);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Frontend: Erro na rota de login:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}