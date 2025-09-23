import { NextResponse } from "next/server";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Extrair o token do corpo da requisição
    const { token, ...paymentData } = body;
    
    const response = await fetch(`${apiUrl}/api/payment/create-checkout`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(paymentData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    
    return NextResponse.json(data);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json(
      { message: "Erro interno do servidor" }, 
      { status: 500 }
    );
  }
}