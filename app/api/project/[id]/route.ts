import { NextRequest, NextResponse } from "next/server";
import { getProjectData, toUiError } from "@/lib/smartsheet";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const sheetId = Number(id);
    if (!Number.isFinite(sheetId)) {
      return NextResponse.json({ error: "无效的项目 ID。" }, { status: 400 });
    }

    const project = await getProjectData(sheetId);
    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json(
      { error: toUiError(error) },
      { status: 500 },
    );
  }
}
