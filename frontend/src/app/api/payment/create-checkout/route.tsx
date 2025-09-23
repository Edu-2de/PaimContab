import { NextResponse } from "next/server";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const response = await fetch(`${apiUrl}/api/payment/create-checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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