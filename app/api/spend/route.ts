import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/spend - 获取所有花费记录
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const spends = await prisma.actualSpend.findMany({
      where: projectId ? { projectId } : undefined,
      include: {
        project: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(spends);
  } catch (error) {
    console.error("Error fetching spends:", error);
    return NextResponse.json(
      { error: "Failed to fetch spends" },
      { status: 500 }
    );
  }
}

// POST /api/spend - 创建新的花费记录
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, date, amount, category, notes } = body;

    // 验证必填字段
    if (!projectId || !date || !amount || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const spend = await prisma.actualSpend.create({
      data: {
        projectId,
        date: new Date(date),
        amount: parseFloat(amount),
        category,
        notes: notes || null,
      },
      include: {
        project: true,
      },
    });

    return NextResponse.json(spend, { status: 201 });
  } catch (error) {
    console.error("Error creating spend:", error);
    return NextResponse.json(
      { error: "Failed to create spend" },
      { status: 500 }
    );
  }
}
