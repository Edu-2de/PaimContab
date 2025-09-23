import { NextResponse } from "next/server";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    console.log('Frontend: Buscando detalhes do usuário:', userId);
    
    const response = await fetch(`${apiUrl}/api/admin/users/${userId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
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
        error: typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : String(error)
      },
      { status: 500 }
    );
  }
}