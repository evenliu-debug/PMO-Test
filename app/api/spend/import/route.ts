import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import xlsx from "node-xlsx";
import { SpendCategory } from "@prisma/client";

// POST /api/spend/import - 从 Excel 批量导入花费
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const projectId = formData.get("projectId") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // 读取 Excel 文件
    const buffer = Buffer.from(await file.arrayBuffer());
    const workSheets = xlsx.parse(buffer);

    // 解析第一个工作表
    const sheet = workSheets[0];
    const data = sheet.data;

    // 跳过标题行,从第1行开始
    const rows = data.slice(1);
    const spends = [];

    // 解析每一行
    for (const row of rows) {
      if (row.length < 3) continue; // 至少需要3列: 日期, 金额, 类别

      const dateValue = row[0];
      const amountValue = row[1];
      const categoryValue = row[2];
      const notesValue = row[3] || "";

      // 跳过空行
      if (!dateValue || !amountValue || !categoryValue) continue;

      // 转换日期 (支持 Excel 日期格式或字符串格式)
      let date: Date;
      if (typeof dateValue === "number") {
        // Excel 日期格式 (从 1900-01-01 开始的天数)
        date = new Date((dateValue - 25569) * 86400 * 1000);
      } else {
        date = new Date(dateValue);
      }

      // 验证类别
      const categoryMap: Record<string, SpendCategory> = {
        "tooling": "Tooling",
        "test setup": "TestSetup",
        "certification": "Certification",
        "bom": "BOM",
        "logistics": "Logistics",
      };

      const categoryKey = categoryValue.toString().toLowerCase().trim();
      const category = categoryMap[categoryKey];

      if (!category) {
        console.warn(`Invalid category: ${categoryValue}, skipping row`);
        continue;
      }

      spends.push({
        projectId,
        date,
        amount: parseFloat(amountValue.toString()),
        category,
        notes: notesValue.toString() || null,
      });
    }

    // 批量插入数据库
    const createdSpends = await prisma.actualSpend.createMany({
      data: spends,
    });

    return NextResponse.json(
      {
        message: `Successfully imported ${createdSpends.count} spend records`,
        imported: createdSpends.count,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error importing spends:", error);
    return NextResponse.json(
      { error: "Failed to import spends" },
      { status: 500 }
    );
  }
}
