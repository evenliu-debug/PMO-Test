"use client";

import type { ProjectSummary } from "@/lib/types";

type ProjectSelectorProps = {
  projects: ProjectSummary[];
  selectedProjectId: number | null;
  onChange: (projectId: number) => void;
};

export function ProjectSelector({
  projects,
  selectedProjectId,
  onChange,
}: ProjectSelectorProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <label className="mb-2 block text-sm font-medium text-zinc-700">
        选择项目
      </label>
      <select
        className="w-full rounded-md border border-zinc-300 p-2 text-sm"
        value={selectedProjectId ?? ""}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        <option value="" disabled>
          请选择一个项目
        </option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
    </div>
  );
}
