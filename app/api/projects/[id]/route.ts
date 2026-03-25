import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { smartsheetService } from "@/lib/smartsheet";
import { googleSheetsService } from "@/lib/google-sheets";

// GET /api/projects/[id] - 获取单个项目详情
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        actualSpends: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // 计算总花费
    const totalSpend = project.actualSpends.reduce((sum, spend) => sum + spend.amount, 0);

    // 从 Smartsheet 获取进度和里程碑
    let progress = 0;
    let milestones = [];
    try {
      const sheetId = smartsheetService.extractSheetId(project.smartsheetUrl);
      if (sheetId) {
        const smartsheetProgress = await smartsheetService.calculateProgress(sheetId);
        progress = smartsheetProgress.progress;
        milestones = smartsheetProgress.milestones || [];
      }
    } catch (error) {
      console.error(`Error fetching Smartsheet data:`, error);
    }

    // 从 Google Sheets 获取预算数据(如果存在)
    let googleSheetData = null;
    if (project.googleSheetId) {
      try {
        googleSheetData = await googleSheetsService.parseMS2Readout(project.googleSheetId);
      } catch (error) {
        console.error(`Error fetching Google Sheets data:`, error);
      }
    }

    // 计算 ROI
    const roi = totalSpend > 0
      ? ((project.salesForecast - totalSpend) / totalSpend) * 100
      : 0;

    // 计算剩余预算
    const remainingBudget = project.totalBudget - totalSpend;

    // 计算预算消耗率
    const budgetConsumption = project.totalBudget > 0
      ? (totalSpend / project.totalBudget) * 100
      : 0;

    return NextResponse.json({
      ...project,
      actualSpend: totalSpend,
      remainingBudget,
      progress,
      roi,
      budgetConsumption,
      milestones,
      googleSheetData,
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - 更新项目
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, smartsheetUrl, googleSheetId, totalBudget, salesForecast, status } = body;

    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(smartsheetUrl && { smartsheetUrl }),
        ...(googleSheetId !== undefined && { googleSheetId: googleSheetId || null }),
        ...(totalBudget !== undefined && { totalBudget: parseFloat(totalBudget) }),
        ...(salesForecast !== undefined && { salesForecast: parseFloat(salesForecast) }),
        ...(status && { status }),
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - 删除项目
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.project.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
