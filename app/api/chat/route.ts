import { NextRequest, NextResponse } from "next/server";
import { getProjectData, toUiError } from "@/lib/smartsheet";
import type { ProjectTask } from "@/lib/types";

type ChatBody = {
  projectId?: number;
  message?: string;
};

function isDelayed(task: ProjectTask): boolean {
  if (!task.endDate) {
    return false;
  }
  const due = new Date(task.endDate).getTime();
  const now = Date.now();
  return due < now && task.percentComplete < 100;
}

function nextMilestone(tasks: ProjectTask[]): ProjectTask | null {
  const now = Date.now();
  return tasks
    .filter((task) => task.endDate)
    .map((task) => ({ task, ts: new Date(task.endDate as string).getTime() }))
    .filter((item) => item.ts >= now)
    .sort((a, b) => a.ts - b.ts)[0]?.task ?? null;
}

function avgProgress(tasks: ProjectTask[]): number {
  if (tasks.length === 0) {
    return 0;
  }
  const total = tasks.reduce((sum, task) => sum + task.percentComplete, 0);
  return Math.round(total / tasks.length);
}

function buildReply(message: string, tasks: ProjectTask[]): string {
  const lower = message.toLowerCase();
  const delayed = tasks.filter(isDelayed);
  const keyTasks = tasks.filter((task) => task.isKeyControl);
  const progress = avgProgress(tasks);

  if (lower.includes("延期") || lower.includes("delayed")) {
    if (delayed.length === 0) {
      return "当前没有发现延期任务。";
    }
    const names = delayed.slice(0, 5).map((task) => task.name).join("、");
    return `当前延期任务 ${delayed.length} 个，重点包括：${names}。`;
  }

  if (lower.includes("里程碑") || lower.includes("milestone") || lower.includes("下个")) {
    const milestone = nextMilestone(tasks);
    if (!milestone || !milestone.endDate) {
      return "暂未识别到下一个明确里程碑日期。";
    }
    return `下一个里程碑是「${milestone.name}」，目标日期 ${milestone.endDate}，当前进度 ${milestone.percentComplete}%。`;
  }

  if (lower.includes("重点") || lower.includes("*") || lower.includes("key")) {
    if (keyTasks.length === 0) {
      return "当前项目没有以 * 标记的重点管控任务。";
    }
    const keyAvg = avgProgress(keyTasks);
    return `重点管控任务共 ${keyTasks.length} 个，平均完成率 ${keyAvg}%。`;
  }

  return `当前整体完成率约 ${progress}%，总任务 ${tasks.length} 个，延期 ${delayed.length} 个。`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatBody;
    if (!body.projectId || !body.message) {
      return NextResponse.json(
        { error: "projectId 和 message 必填。" },
        { status: 400 },
      );
    }

    const project = await getProjectData(body.projectId);
    const reply = buildReply(body.message, project.tasks);

    return NextResponse.json({
      reply,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: toUiError(error) },
      { status: 500 },
    );
  }
}
