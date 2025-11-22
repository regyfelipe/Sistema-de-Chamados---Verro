import { NextResponse } from "next/server";
import { checkTicketsWithoutResponse } from "@/lib/automation-engine";

export async function GET() {
  try {
    const days = parseInt(
      new URLSearchParams(new URL(process.env.NEXT_PUBLIC_URL || "").search).get(
        "days"
      ) || "7"
    );
    await checkTicketsWithoutResponse(days);
    return NextResponse.json({
      success: true,
      message: "Verificação de tickets sem resposta concluída",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const days = body.days || 7;
    await checkTicketsWithoutResponse(days);
    return NextResponse.json({
      success: true,
      message: "Verificação de tickets sem resposta concluída",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

