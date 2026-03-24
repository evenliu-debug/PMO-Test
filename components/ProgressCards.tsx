"use client";

import type { ProjectTask } from "@/lib/types";

type ProgressCardsProps = {
  tasks: ProjectTask[];
};

function averageProgress(tasks: ProjectTask[]): number {
  if (tasks.length === 0) {
    return 0;
  }
  const total = tasks.reduce((sum, task) => sum + task.percentComplete, 0);
  return Math.round(total / tasks.length);
}

export function ProgressCards({ tasks }: ProgressCardsProps) {
  const delayedCount = tasks.filter((task) => {
    if (!task.endDate) return false;
    return new Date(task.endDate).getTime() < Date.now() && task.percentComplete < 100;
  }).length;
  const keyCount = tasks.filter((task) => task.isKeyControl).length;

  const cards = [
    { label: "总任务数", value: tasks.length },
    { label: "整体完成率", value: `${averageProgress(tasks)}%` },
    { label: "延期任务", value: delayedCount },
    { label: "重点管控项", value: keyCount },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="text-xs text-zinc-500">{card.label}</div>
          <div className="mt-2 text-2xl font-semibold text-zinc-900">{card.value}</div>
        </div>
      ))}
    </div>
  );
}
