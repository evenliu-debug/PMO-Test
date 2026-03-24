"use client";

import type { ProjectTask } from "@/lib/types";

type GanttViewProps = {
  tasks: ProjectTask[];
  keyOnly: boolean;
  onModeChange: (keyOnly: boolean) => void;
};

function calcRange(task: ProjectTask): { start: number; span: number } {
  const defaultRange = { start: 0, span: 100 };
  if (!task.startDate || !task.endDate) {
    return defaultRange;
  }
  const start = new Date(task.startDate).getTime();
  const end = new Date(task.endDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return defaultRange;
  }
  const total = end - start;
  const elapsed = Math.max(0, Date.now() - start);
  const completePercent = Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
  return { start: 0, span: Math.max(8, completePercent) };
}

export function GanttView({ tasks, keyOnly, onModeChange }: GanttViewProps) {
  const displayTasks = keyOnly ? tasks.filter((task) => task.isKeyControl) : tasks;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-800">甘特图视图</h2>
        <div className="flex gap-2">
          <button
            className={`rounded-md px-3 py-1 text-xs ${
              !keyOnly ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700"
            }`}
            onClick={() => onModeChange(false)}
          >
            全部任务
          </button>
          <button
            className={`rounded-md px-3 py-1 text-xs ${
              keyOnly ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700"
            }`}
            onClick={() => onModeChange(true)}
          >
            重点管控项
          </button>
        </div>
      </div>

      <p className="mb-3 text-xs text-zinc-500">
        当前显示 {displayTasks.length} 条任务 {keyOnly ? "(仅 * 重点项)" : ""}
      </p>

      {displayTasks.length === 0 ? (
        <div className="rounded-md border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
          当前没有可显示的任务。
        </div>
      ) : (
        <div className="space-y-3">
          {displayTasks.map((task) => {
            const range = calcRange(task);
            return (
              <div key={task.id} className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-4 truncate text-xs text-zinc-700">{task.name}</div>
                <div className="col-span-8">
                  <div className="h-3 w-full rounded bg-zinc-100">
                    <div
                      className="h-3 rounded bg-blue-500"
                      style={{ marginLeft: `${range.start}%`, width: `${range.span}%` }}
                    />
                  </div>
                  <div className="mt-1 text-[10px] text-zinc-500">
                    {task.startDate ?? "?"} ~ {task.endDate ?? "?"} | 完成 {task.percentComplete}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
