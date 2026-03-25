"use client";

import { useState } from "react";
import Link from "next/link";

export default function NewProject() {
  const [formData, setFormData] = useState({
    name: "",
    smartsheetUrl: "",
    googleSheetId: "",
    totalBudget: "",
    salesForecast: "",
    status: "ACTIVE",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create project");
      }

      const project = await response.json();
      window.location.href = `/projects/${project.id}`;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <Link href="/" className="text-blue-600 hover:underline text-sm mb-2 block">
                ← 返回首页
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                创建新项目
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                项目名称 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Smartsheet 链接 *
              </label>
              <input
                type="url"
                value={formData.smartsheetUrl}
                onChange={(e) =>
                  setFormData({ ...formData, smartsheetUrl: e.target.value })
                }
                placeholder="https://app.smartsheet.com/sheets/..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Smartsheet 中项目计划的 URL
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Sheet ID
              </label>
              <input
                type="text"
                value={formData.googleSheetId}
                onChange={(e) =>
                  setFormData({ ...formData, googleSheetId: e.target.value })
                }
                placeholder="Google Sheet ID"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                可选:Google Sheets 中预算和销售预测表格的 ID
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                总预算 (¥) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.totalBudget}
                onChange={(e) =>
                  setFormData({ ...formData, totalBudget: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                销售预测 (¥)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.salesForecast}
                onChange={(e) =>
                  setFormData({ ...formData, salesForecast: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                可选:预期的总销售收入
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                状态
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="ACTIVE">Active</option>
                <option value="PLANNING">Planning</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "创建中..." : "创建项目"}
              </button>
              <Link
                href="/"
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition text-center"
              >
                取消
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
