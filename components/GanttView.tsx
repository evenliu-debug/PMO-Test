"use client";

import { useMemo, useState } from "react";
import type { ProjectTask } from "@/lib/types";

type GanttViewProps = {
  tasks: ProjectTask[];
  keyOnly: boolean;
  onModeChange: (keyOnly: boolean) => void;
};

type TimeScale = "day" | "week" | "month";

const DAY_MS = 24 * 60 * 60 * 1000;

function toTime(dateString: string | null): number | null {
  if (!dateString) {
    return null;
  }
  const value = new Date(dateString).getTime();
  return Number.isNaN(value) ? null : value;
}

function formatTickLabel(ts: number, scale: TimeScale): string {
  const date = new Date(ts);
  const base = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
  if (scale === "week") return `${base} W`;
  if (scale === "month") return base;
  return base;
}

function buildTicks(start: number, end: number, scale: TimeScale): number[] {
  const unitDays = scale === "day" ? 1 : scale === "week" ? 7 : 30;
  const stepMs = unitDays * DAY_MS;
  const ticks: number[] = [];
  for (let cursor = start; cursor <= end; cursor += stepMs) {
    ticks.push(cursor);
  }
  if (ticks[ticks.length - 1] !== end) {
    ticks.push(end);
  }
  return ticks;
}

function barColor(task: ProjectTask, index: number): string {
  if (task.percentComplete >= 100) return "bg-emerald-500";
  if (task.status.includes("阻塞") || task.status.includes("风险")) return "bg-rose-500";
  const palette = ["bg-sky-500", "bg-violet-500", "bg-cyan-500", "bg-indigo-500", "bg-fuchsia-500"];
  return palette[index % palette.length];
}

export function GanttView({ tasks, keyOnly, onModeChange }: GanttViewProps) {
  const [timeScale, setTimeScale] = useState<TimeScale>("week");
  const [nearbyDays, setNearbyDays] = useState(14);
  const [nearbyMode, setNearbyMode] = useState(false);
  const [now] = useState(() => Date.now());

  const displayTasks = useMemo(() => {
    const sourceTasks = keyOnly ? tasks.filter((task) => task.isKeyControl) : tasks;
    const windowStart = now - nearbyDays * DAY_MS;
    const windowEnd = now + nearbyDays * DAY_MS;
    return sourceTasks.filter((task) => {
      if (!nearbyMode) return true;
      const start = toTime(task.startDate);
      const end = toTime(task.endDate);
      if (start === null && end === null) return false;
      const taskStart = start ?? end ?? now;
      const taskEnd = end ?? start ?? now;
      return taskStart <= windowEnd && taskEnd >= windowStart;
    });
  }, [keyOnly, tasks, nearbyMode, nearbyDays, now]);

  const timedTasks = useMemo(
    () =>
      displayTasks.filter(
        (task) => toTime(task.startDate) !== null && toTime(task.endDate) !== null,
      ),
    [displayTasks],
  );
  const timelineStartRaw =
    timedTasks.length > 0
      ? Math.min(...timedTasks.map((task) => toTime(task.startDate) ?? now))
      : now - 7 * DAY_MS;
  const timelineEndRaw =
    timedTasks.length > 0
      ? Math.max(...timedTasks.map((task) => toTime(task.endDate) ?? now))
      : now + 7 * DAY_MS;
  const timelineStart = timelineStartRaw - DAY_MS;
  const timelineEnd = Math.max(timelineStart + DAY_MS, timelineEndRaw + DAY_MS);
  const timelineSpan = Math.max(DAY_MS, timelineEnd - timelineStart);
  const ticks = buildTicks(timelineStart, timelineEnd, timeScale);
  const todayPercent = ((now - timelineStart) / timelineSpan) * 100;
  const groupedTasks = useMemo(() => {
    const map = new Map<string, ProjectTask[]>();
    for (const task of displayTasks) {
      const key = task.projectName || "未命名项目";
      const list = map.get(key) ?? [];
      list.push(task);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [displayTasks]);

  return (
    <div className="max-h-[72vh] overflow-y-auto rounded-lg border border-zinc-200 bg-white p-4">
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

      <div className="mb-3 grid gap-2 md:grid-cols-3">
        <label className="text-xs text-zinc-600">
          时间刻度
          <select
            className="mt-1 w-full rounded-md border border-zinc-300 p-1.5 text-xs"
            value={timeScale}
            onChange={(event) => setTimeScale(event.target.value as TimeScale)}
          >
            <option value="day">按日</option>
            <option value="week">按周</option>
            <option value="month">按月</option>
          </select>
        </label>
        <label className="text-xs text-zinc-600">
          最近任务 x 天（前后）
          <input
            type="number"
            min={1}
            value={nearbyDays}
            onChange={(event) => setNearbyDays(Math.max(1, Number(event.target.value) || 1))}
            className="mt-1 w-full rounded-md border border-zinc-300 p-1.5 text-xs"
          />
        </label>
        <label className="flex items-end gap-2 pb-1 text-xs text-zinc-700">
          <input
            type="checkbox"
            checked={nearbyMode}
            onChange={(event) => setNearbyMode(event.target.checked)}
          />
          仅显示最近任务窗口
        </label>
      </div>

      <p className="mb-3 text-xs text-zinc-500">
        当前显示 {displayTasks.length} 条任务 {keyOnly ? "(仅 * 重点项)" : ""}
        {nearbyMode ? `（今天前后 ${nearbyDays} 天）` : ""}
      </p>

      {groupedTasks.length === 0 ? (
        <div className="rounded-md border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
          当前没有可显示的任务。
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-zinc-200">
          <table className="min-w-full border-collapse text-xs">
            <thead className="bg-zinc-50">
              <tr>
                <th className="w-40 border-b border-r border-zinc-200 p-2 text-left">项目</th>
                <th className="w-64 border-b border-r border-zinc-200 p-2 text-left">任务</th>
                <th className="w-44 border-b border-r border-zinc-200 p-2 text-left">时间</th>
                <th className="min-w-[560px] border-b border-zinc-200 p-2">
                  <div className="relative h-8">
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      {ticks.map((tick, index) => (
                        <span key={index}>{formatTickLabel(tick, timeScale)}</span>
                      ))}
                    </div>
                    <div
                      className="pointer-events-none absolute bottom-0 top-0 border-l border-dashed border-red-500"
                      style={{ left: `${Math.max(0, Math.min(100, todayPercent))}%` }}
                    />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {groupedTasks.map(([projectName, projectTasks]) =>
                projectTasks.map((task, index) => {
                  const start = toTime(task.startDate);
                  const end = toTime(task.endDate);
                  const hasTimeline = start !== null && end !== null && end > start;
                  const startPercent = hasTimeline ? ((start - timelineStart) / timelineSpan) * 100 : 0;
                  const widthPercent = hasTimeline ? ((end - start) / timelineSpan) * 100 : 100;
                  return (
                    <tr key={`${task.projectId ?? "p"}-${task.id}`} className="border-b border-zinc-100 align-top">
                      {index === 0 ? (
                        <td
                          rowSpan={projectTasks.length}
                          className="border-r border-zinc-200 bg-zinc-50 p-2 font-medium text-zinc-700"
                        >
                          {projectName}
                          <div className="mt-1 text-[10px] font-normal text-zinc-500">
                            {projectTasks.length} 个任务
                          </div>
                        </td>
                      ) : null}
                      <td className="border-r border-zinc-200 p-2 text-zinc-700">{task.name}</td>
                      <td className="border-r border-zinc-200 p-2 text-zinc-500">
                        {task.startDate ?? "?"} ~ {task.endDate ?? "?"}
                      </td>
                      <td className="p-2">
                        <div className="relative h-4 rounded bg-zinc-100">
                          <div
                            className="pointer-events-none absolute bottom-0 top-0 border-l border-dashed border-red-500"
                            style={{ left: `${Math.max(0, Math.min(100, todayPercent))}%` }}
                          />
                          {hasTimeline ? (
                            <div
                              className={`h-4 rounded ${barColor(task, task.id)}`}
                              style={{
                                marginLeft: `${Math.max(0, Math.min(100, startPercent))}%`,
                                width: `${Math.max(2, Math.min(100, widthPercent))}%`,
                              }}
                            />
                          ) : (
                            <div className="h-4 w-full rounded bg-zinc-300" />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
