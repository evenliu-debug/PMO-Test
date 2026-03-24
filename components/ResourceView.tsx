"use client";

import type { ProjectTask } from "@/lib/types";

type ResourceViewProps = {
  tasks: ProjectTask[];
};

export function ResourceView({ tasks }: ResourceViewProps) {
  const resourceMap = new Map<string, { total: number; done: number }>();

  tasks.forEach((task) => {
    const owner = task.owner || "未分配";
    const current = resourceMap.get(owner) ?? { total: 0, done: 0 };
    current.total += 1;
    if (task.percentComplete >= 100) {
      current.done += 1;
    }
    resourceMap.set(owner, current);
  });

  const rows = [...resourceMap.entries()].map(([owner, stats]) => ({
    owner,
    total: stats.total,
    done: stats.done,
    load: Math.round(((stats.total - stats.done) / Math.max(1, stats.total)) * 100),
  }));

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-800">资源情况</h2>
      {rows.length === 0 ? (
        <div className="text-sm text-zinc-500">暂无资源数据。</div>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.owner} className="rounded-md border border-zinc-100 p-2 text-xs">
              <div className="flex justify-between">
                <span>{row.owner}</span>
                <span>
                  总任务 {row.total} / 已完成 {row.done}
                </span>
              </div>
              <div className="mt-1 h-2 w-full rounded bg-zinc-100">
                <div className="h-2 rounded bg-emerald-500" style={{ width: `${row.load}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
