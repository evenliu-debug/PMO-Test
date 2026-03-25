import { SmartsheetProgress, Milestone } from "./types";

// Smartsheet API 服务
export class SmartsheetService {
  private static instance: SmartsheetService;
  private accessToken: string;
  private baseUrl = "https://api.smartsheet.com/2.0";

  private constructor() {
    this.accessToken = process.env.SMARTSHEET_ACCESS_TOKEN || "";
  }

  public static getInstance(): SmartsheetService {
    if (!SmartsheetService.instance) {
      SmartsheetService.instance = new SmartsheetService();
    }
    return SmartsheetService.instance;
  }

  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Smartsheet API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // 从 URL 提取 Sheet ID
  extractSheetId(url: string): string {
    const match = url.match(/\/([a-zA-Z0-9]+)(?:\/|\?|$)/);
    return match ? match[1] : "";
  }

  // 获取 Sheet 信息
  async getSheet(sheetId: string): Promise<any> {
    return this.request(`/sheets/${sheetId}`);
  }

  // 获取 Sheet 所有行
  async getRows(sheetId: string): Promise<any> {
    const sheet = await this.getSheet(sheetId);
    return this.request(`/sheets/${sheetId}/rows`);
  }

  // 计算整体进度
  async calculateProgress(sheetId: string): Promise<SmartsheetProgress> {
    try {
      const sheet = await this.getSheet(sheetId);
      const rows = await this.getRows(sheetId);

      let totalRows = rows.length;
      let completedRows = 0;
      let milestones: Milestone[] = [];

      // 解析每一行的状态
      for (const row of rows) {
        const rowObj = row;

        // 查找状态列 (通常是 "Status" 或 "状态")
        const statusCell = rowObj.cells?.find((cell: any) =>
          cell.columnId === sheet.columns?.find((col: any) =>
            col.title?.toLowerCase().includes("status") ||
            col.title?.toLowerCase().includes("状态")
          )?.id
        );

        if (statusCell) {
          const status = statusCell.value?.toLowerCase() || "";

          // 检查是否完成
          if (status.includes("complete") || status.includes("done") || status === "已完成") {
            completedRows++;
          }

          // 提取里程碑信息
          const nameCell = rowObj.cells?.find((cell: any) =>
            cell.columnId === sheet.columns?.find((col: any) =>
              col.title?.toLowerCase().includes("task") ||
              col.title?.toLowerCase().includes("name") ||
              col.title?.toLowerCase().includes("任务")
            )?.id
          );

          if (nameCell && statusCell.value) {
            let milestoneStatus: Milestone["status"] = "Not Started";
            if (status.includes("complete") || status.includes("done") || status === "已完成") {
              milestoneStatus = "Completed";
            } else if (status.includes("progress") || status.includes("进行中")) {
              milestoneStatus = "In Progress";
            }

            milestones.push({
              name: nameCell.value || "Unknown",
              status: milestoneStatus,
            });
          }
        }
      }

      const progress = totalRows > 0 ? (completedRows / totalRows) * 100 : 0;

      return {
        sheetId,
        totalRows,
        completedRows,
        progress,
        milestones: milestones.slice(0, 10), // 只返回前10个里程碑
      };
    } catch (error) {
      console.error("Error calculating Smartsheet progress:", error);
      throw error;
    }
  }

  // 获取关键里程碑
  async getMilestones(sheetId: string): Promise<Milestone[]> {
    const progress = await this.calculateProgress(sheetId);
    return progress.milestones || [];
  }

  // 更新行状态
  async updateRow(sheetId: string, rowId: string, updates: any): Promise<any> {
    return this.request(`/sheets/${sheetId}/rows`, {
      method: "PUT",
      body: JSON.stringify({
        id: rowId,
        cells: updates,
      }),
    });
  }
}

export const smartsheetService = SmartsheetService.getInstance();
