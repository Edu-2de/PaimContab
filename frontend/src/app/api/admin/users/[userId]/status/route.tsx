import { NextResponse } from "next/server";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    
    console.log('Frontend: Atualizando status do usuário:', userId, body);
    
    const response = await fetch(`${apiUrl}/api/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    console.log('Frontend: Status da resposta:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Frontend: Erro do backend:', errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Frontend: Status atualizado com sucesso');
    return NextResponse.json(data);
  } catch (error) {
    console.error('Frontend: Erro na rota de atualização de status:', error);
    return NextResponse.json(
      { 
        message: 'Erro interno do servidor', 
        error: typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : String(error)
      },
      { status: 500 }
    );
  }
}