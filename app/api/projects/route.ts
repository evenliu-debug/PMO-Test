import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { smartsheetService } from "@/lib/smartsheet";
import { googleSheetsService } from "@/lib/google-sheets";

// GET /api/projects - 获取所有项目
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        actualSpends: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 计算每个项目的实际指标
    const enrichedProjects = await Promise.all(
      projects.map(async (project) => {
        // 计算总花费
        const totalSpend = project.actualSpends.reduce((sum, spend) => sum + spend.amount, 0);

        // 从 Smartsheet 获取进度
        let progress = 0;
        try {
          const sheetId = smartsheetService.extractSheetId(project.smartsheetUrl);
          if (sheetId) {
            const smartsheetProgress = await smartsheetService.calculateProgress(sheetId);
            progress = smartsheetProgress.progress;
          }
        } catch (error) {
          console.error(`Error fetching progress for project ${project.id}:`, error);
        }

        // 计算 ROI
        const roi = totalSpend > 0
          ? ((project.salesForecast - totalSpend) / totalSpend) * 100
          : 0;

        // 计算预算消耗率
        const budgetConsumption = project.totalBudget > 0
          ? (totalSpend / project.totalBudget) * 100
          : 0;

        return {
          ...project,
          actualSpend: totalSpend,
          progress,
          roi,
          budgetConsumption,
        };
      })
    );

    return NextResponse.json(enrichedProjects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - 创建新项目
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, smartsheetUrl, googleSheetId, totalBudget, salesForecast, status } = body;

    // 验证必填字段
    if (!name || !smartsheetUrl || !totalBudget) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 创建项目
    const project = await prisma.project.create({
      data: {
        name,
        smartsheetUrl,
        googleSheetId: googleSheetId || null,
        totalBudget: parseFloat(totalBudget),
        salesForecast: parseFloat(salesForecast || 0),
        status: status || "ACTIVE",
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
