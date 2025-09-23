import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
  try {
    console.log('Frontend: Buscando dashboard em:', `${apiUrl}/api/admin/dashboard`);
    
    // Buscar token dos cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;
    
    console.log('Frontend: Token encontrado:', token ? 'SIM' : 'NÃO');
    
    if (!token) {
      return NextResponse.json(
        { message: 'Token de acesso requerido', code: 'NO_TOKEN' },
        { status: 401 }
      );
    }
    
    const response = await fetch(`${apiUrl}/api/admin/dashboard`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    console.log('Frontend: Status da resposta:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Frontend: Erro do backend:', errorText);
      return NextResponse.json(
        JSON.parse(errorText),
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Frontend: Dados recebidos:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Frontend: Erro na rota do dashboard:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}