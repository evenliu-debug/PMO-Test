"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Project {
  id: string;
  name: string;
  status: string;
  totalBudget: number;
  actualSpend: number;
  remainingBudget: number;
  salesForecast: number;
  progress: number;
  roi: number;
  budgetConsumption: number;
  actualSpends: Array<{
    id: string;
    date: Date;
    amount: number;
    category: string;
    notes: string | null;
  }>;
  milestones?: Array<{
    name: string;
    status: string;
  }>;
}

export default function ProjectDetail({
  params,
}: {
  params: { id: string };
}) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "spend" | "smartsheet">("overview");
  const [newSpend, setNewSpend] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    category: "Tooling",
    notes: "",
  });

  useEffect(() => {
    fetchProject();
  }, [params.id]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`);
      const data = await response.json();
      setProject(data);
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSpend = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/spend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: params.id,
          ...newSpend,
        }),
      });
      setNewSpend({
        date: new Date().toISOString().split("T")[0],
        amount: "",
        category: "Tooling",
        notes: "",
      });
      fetchProject();
    } catch (error) {
      console.error("Error adding spend:", error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", params.id);

    try {
      await fetch("/api/spend/import", {
        method: "POST",
        body: formData,
      });
      fetchProject();
    } catch (error) {
      console.error("Error importing file:", error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
    }).format(value);
  };

  // 准备图表数据
  const chartData = project
    ? [
        {
          name: "预算",
          总预算: project.totalBudget,
          已花费: project.actualSpend,
          剩余: project.remainingBudget,
        },
      ]
    : [];

  // 准备花费分类数据
  const spendByCategory = project
    ? project.actualSpends.reduce((acc, spend) => {
        const category = spend.category;
        if (!acc[category]) acc[category] = 0;
        acc[category] += spend.amount;
        return acc;
      }, {} as Record<string, number>)
    : {};

  const categoryChartData = Object.entries(spendByCategory).map(([category, amount]) => ({
    category,
    amount,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">项目不存在</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            返回首页
          </Link>
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
            <div>
              <Link href="/" className="text-blue-600 hover:underline text-sm mb-2 block">
                ← 返回首页
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <div className="flex items-center mt-2 space-x-4">
                <span
                  className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    project.status === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {project.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-2">总预算</div>
            <div className="text-3xl font-bold text-gray-900">
              {formatCurrency(project.totalBudget)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-2">已花费</div>
            <div className="text-3xl font-bold text-red-600">
              {formatCurrency(project.actualSpend)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-2">剩余预算</div>
            <div
              className={`text-3xl font-bold ${
                project.remainingBudget >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(project.remainingBudget)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-2">实时 ROI</div>
            <div
              className={`text-3xl font-bold ${
                project.roi >= 100 ? "text-green-600" : "text-red-600"
              }`}
            >
              {project.roi.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 预算 vs 实际花费 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              预算 vs 实际花费
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="总预算" fill="#3B82F6" />
                <Bar dataKey="已花费" fill="#EF4444" />
                <Bar dataKey="剩余" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 花费分类 */}
          {categoryChartData.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                花费分类
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="amount" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { key: "overview", label: "概览" },
                { key: "spend", label: "花费录入" },
                { key: "smartsheet", label: "Smartsheet 进度" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`${
                    activeTab === tab.key
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "overview" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  项目信息
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      项目名称
                    </label>
                    <p className="text-gray-900">{project.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      状态
                    </label>
                    <p className="text-gray-900">{project.status}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      总预算
                    </label>
                    <p className="text-gray-900">{formatCurrency(project.totalBudget)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      销售预测
                    </label>
                    <p className="text-gray-900">{formatCurrency(project.salesForecast)}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "spend" && (
              <div>
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    新增花费
                  </h3>
                  <form onSubmit={handleAddSpend} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        日期
                      </label>
                      <input
                        type="date"
                        value={newSpend.date}
                        onChange={(e) =>
                          setNewSpend({ ...newSpend, date: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        金额
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newSpend.amount}
                        onChange={(e) =>
                          setNewSpend({ ...newSpend, amount: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        类别
                      </label>
                      <select
                        value={newSpend.category}
                        onChange={(e) =>
                          setNewSpend({ ...newSpend, category: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        required
                      >
                        <option value="Tooling">Tooling</option>
                        <option value="TestSetup">Test Setup</option>
                        <option value="Certification">Certification</option>
                        <option value="BOM">BOM</option>
                        <option value="Logistics">Logistics</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        备注
                      </label>
                      <input
                        type="text"
                        value={newSpend.notes}
                        onChange={(e) =>
                          setNewSpend({ ...newSpend, notes: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                      >
                        添加花费
                      </button>
                    </div>
                  </form>
                </div>

                <div className="border-t border-gray-200 pt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Excel 批量导入
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      上传 Excel 文件
                    </label>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Excel 文件应包含以下列: 日期、金额、类别、备注
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    花费记录
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            日期
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            金额
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            类别
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            备注
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {project.actualSpends.map((spend) => (
                          <tr key={spend.id}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {new Date(spend.date).toLocaleDateString("zh-CN")}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {formatCurrency(spend.amount)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {spend.category}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {spend.notes || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "smartsheet" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Smartsheet 进度
                </h3>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      整体进度
                    </span>
                    <span className="text-sm text-gray-600">
                      {project.progress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-blue-600 h-4 rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>

                {project.milestones && project.milestones.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-4">
                      关键里程碑
                    </h4>
                    <div className="space-y-3">
                      {project.milestones.map((milestone, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-3 h-3 rounded-full mr-3 ${
                                milestone.status === "Completed"
                                  ? "bg-green-500"
                                  : milestone.status === "In Progress"
                                  ? "bg-yellow-500"
                                  : "bg-gray-400"
                              }`}
                            ></div>
                            <span className="text-sm text-gray-900">
                              {milestone.name}
                            </span>
                          </div>
                          <span
                            className={`text-sm px-2 py-1 rounded ${
                              milestone.status === "Completed"
                                ? "bg-green-100 text-green-800"
                                : milestone.status === "In Progress"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {milestone.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
