"use client";

import type { ProjectSummary } from "@/lib/types";

type ProjectSelectorProps = {
  projects: ProjectSummary[];
  selectedProjectIds: number[];
  onChange: (projectIds: number[]) => void;
};

export function ProjectSelector({
  projects,
  selectedProjectIds,
  onChange,
}: ProjectSelectorProps) {
  const selectedSet = new Set(selectedProjectIds);
  const allSelected = projects.length > 0 && selectedProjectIds.length === projects.length;

  function toggleProject(projectId: number) {
    if (selectedSet.has(projectId)) {
      onChange(selectedProjectIds.filter((id) => id !== projectId));
      return;
    }
    onChange([...selectedProjectIds, projectId]);
  }

  function selectAll() {
    onChange(projects.map((project) => project.id));
  }

  function clearAll() {
    onChange([]);
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <label className="block text-sm font-medium text-zinc-700">选择项目（可多选）</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="rounded-md bg-zinc-900 px-3 py-1 text-xs text-white"
          >
            全选
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="rounded-md bg-zinc-100 px-3 py-1 text-xs text-zinc-700"
          >
            清空
          </button>
        </div>
      </div>
      <p className="mb-2 text-xs text-zinc-500">
        已选 {selectedProjectIds.length} / {projects.length}
      </p>
      <div className="max-h-48 space-y-2 overflow-auto rounded-md border border-zinc-200 p-2">
        {projects.map((project) => (
          <label
            key={project.id}
            className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-zinc-50"
          >
            <input
              type="checkbox"
              checked={selectedSet.has(project.id)}
              onChange={() => toggleProject(project.id)}
            />
            <span className="truncate">{project.name}</span>
          </label>
        ))}
      </div>
      <p className="mt-2 text-xs text-zinc-500">{allSelected ? "当前为全选状态" : "可选择一个或多个项目"}</p>
    </div>
  );
}
