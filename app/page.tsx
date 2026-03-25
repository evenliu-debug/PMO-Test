"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  status: string;
  totalBudget: number;
  actualSpend: number;
  salesForecast: number;
  progress: number;
  roi: number;
  budgetConsumption: number;
  createdAt: Date;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "PLANNING":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800";
      case "ON_HOLD":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            PMO Insights Dashboard
          </h1>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              PMO Insights Dashboard
            </h1>
            <button
              onClick={() => (window.location.href = "/projects/new")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              新增项目
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-2">总项目数</div>
            <div className="text-3xl font-bold text-gray-900">
              {projects.length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-2">总预算</div>
            <div className="text-3xl font-bold text-gray-900">
              {formatCurrency(
                projects.reduce((sum, p) => sum + p.totalBudget, 0)
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-2">已花费</div>
            <div className="text-3xl font-bold text-red-600">
              {formatCurrency(
                projects.reduce((sum, p) => sum + p.actualSpend, 0)
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-2">平均 ROI</div>
            <div
              className={`text-3xl font-bold ${
                projects.length > 0 &&
                projects.reduce((sum, p) => sum + p.roi, 0) / projects.length >= 100
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {projects.length > 0
                ? `${(projects.reduce((sum, p) => sum + p.roi, 0) / projects.length).toFixed(1)}%`
                : "0%"}
            </div>
          </div>
        </div>

        {/* Projects Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">项目列表</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    项目名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    进度
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    预算
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    已花费
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ROI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    预算消耗率
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => (window.location.href = `/projects/${project.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {project.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(project.createdAt).toLocaleDateString("zh-CN")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          project.status
                        )}`}
                      >
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm text-gray-600">
                          {project.progress.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(project.totalBudget)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(project.actualSpend)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`font-semibold ${
                          project.roi < 100 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {project.roi.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${
                              project.budgetConsumption > 100
                                ? "bg-red-600"
                                : "bg-green-600"
                            }`}
                            style={{ width: `${Math.min(project.budgetConsumption, 100)}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm text-gray-600">
                          {project.budgetConsumption.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {projects.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">暂无项目</p>
              <button
                onClick={() => (window.location.href = "/projects/new")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                创建第一个项目
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
