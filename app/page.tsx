"use client";

import { useEffect, useMemo, useState } from "react";
import { GanttView } from "@/components/GanttView";
import { ProgressCards } from "@/components/ProgressCards";
import { ProjectChat } from "@/components/ProjectChat";
import { ProjectSelector } from "@/components/ProjectSelector";
import { ResourceView } from "@/components/ResourceView";
import type { ProjectData, ProjectSummary } from "@/lib/types";

export default function Home() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingProjectData, setLoadingProjectData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyOnly, setKeyOnly] = useState(false);

  useEffect(() => {
    async function loadProjects() {
      setLoadingProjects(true);
      setError(null);
      try {
        const response = await fetch("/api/projects");
        const payload = (await response.json()) as {
          projects?: ProjectSummary[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload.error ?? "加载项目失败。");
        }
        const list = payload.projects ?? [];
        setProjects(list);
        if (list.length > 0) {
          setSelectedProjectId(list[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载项目失败。");
      } finally {
        setLoadingProjects(false);
      }
    }
    void loadProjects();
  }, []);

  useEffect(() => {
    async function loadProjectData(projectId: number) {
      setLoadingProjectData(true);
      setError(null);
      try {
        const response = await fetch(`/api/project/${projectId}`);
        const payload = (await response.json()) as {
          project?: ProjectData;
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload.error ?? "加载项目详情失败。");
        }
        setProjectData(payload.project ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载项目详情失败。");
      } finally {
        setLoadingProjectData(false);
      }
    }

    if (selectedProjectId) {
      void loadProjectData(selectedProjectId);
    }
  }, [selectedProjectId]);

  const tasks = useMemo(() => projectData?.tasks ?? [], [projectData]);

  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-zinc-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <h1 className="text-2xl font-bold">Smartsheet 项目管理驾驶舱</h1>
        <ProjectSelector
          projects={projects}
          selectedProjectId={selectedProjectId}
          onChange={(id) => setSelectedProjectId(id)}
        />

        {loadingProjects || loadingProjectData ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
            正在加载数据...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {!error && projectData ? (
          <>
            <ProgressCards tasks={tasks} />
            <div className="grid gap-4 lg:grid-cols-2">
              <GanttView tasks={tasks} keyOnly={keyOnly} onModeChange={setKeyOnly} />
              <ResourceView tasks={tasks} />
            </div>
            <ProjectChat projectId={selectedProjectId} />
          </>
        ) : null}
      </div>
    </main>
  );
}
