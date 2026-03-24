import { NextResponse } from "next/server";
import { listProjects, toUiError } from "@/lib/smartsheet";

export async function GET() {
  try {
    const projects = await listProjects();
    return NextResponse.json({ projects });
  } catch (error) {
    return NextResponse.json(
      { error: toUiError(error) },
      { status: 500 },
    );
  }
}
