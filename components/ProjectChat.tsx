"use client";

import { useState } from "react";

type ProjectChatProps = {
  projectId: number | null;
};

export function ProjectChat({ projectId }: ProjectChatProps) {
  const [input, setInput] = useState("");
  const [reply, setReply] = useState("你可以问我：项目进度到哪里了？有延期吗？重点项怎么样？");
  const [loading, setLoading] = useState(false);

  async function ask() {
    if (!projectId || !input.trim()) {
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          message: input.trim(),
        }),
      });
      const payload = (await response.json()) as { reply?: string; error?: string };
      if (!response.ok) {
        setReply(payload.error ?? "对话请求失败。");
      } else {
        setReply(payload.reply ?? "暂无回复。");
      }
    } catch {
      setReply("请求失败，请检查网络或后端服务。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-800">项目对话</h2>
      <div className="mb-3 rounded-md bg-zinc-50 p-3 text-sm text-zinc-700">{reply}</div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="例如：这个项目进度到哪里了？"
          className="flex-1 rounded-md border border-zinc-300 p-2 text-sm"
        />
        <button
          onClick={ask}
          disabled={loading || !projectId}
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {loading ? "查询中..." : "发送"}
        </button>
      </div>
    </div>
  );
}
