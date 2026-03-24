import type { ProjectData, ProjectSummary, ProjectTask } from "@/lib/types";

type SmartsheetCell = {
  columnId: number;
  value?: string | number | boolean | null;
  displayValue?: string | null;
};

type SmartsheetColumn = {
  id: number;
  title: string;
};

type SmartsheetRow = {
  id: number;
  cells: SmartsheetCell[];
};

type SmartsheetSheet = {
  id: number;
  name: string;
  columns: SmartsheetColumn[];
  rows: SmartsheetRow[];
};

const SMARTSHEET_BASE_URL = "https://api.smartsheet.com/2.0";

class SmartsheetApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getToken(): string {
  const token = process.env.SMARTSHEET_API_TOKEN;
  if (!token) {
    throw new Error("Missing SMARTSHEET_API_TOKEN in environment.");
  }
  return token;
}

function parseConfiguredSheetIds(): number[] {
  const raw = process.env.SMARTSHEET_SHEET_IDS?.trim();
  if (!raw) {
    return [];
  }
  return raw
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((num) => Number.isFinite(num) && num > 0);
}

async function smartsheetFetch<T>(path: string): Promise<T> {
  const token = getToken();
  const response = await fetch(`${SMARTSHEET_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new SmartsheetApiError(
      `Smartsheet API request failed (${response.status}): ${body}`,
      response.status,
    );
  }

  return (await response.json()) as T;
}

function normalizeKey(input: string): string {
  return input.toLowerCase().replace(/\s|_/g, "");
}

function matchesColumn(title: string, aliases: string[]): boolean {
  const normalized = normalizeKey(title);
  return aliases.some((alias) => normalized.includes(normalizeKey(alias)));
}

function getCellValue(row: SmartsheetRow, columnId: number): string {
  const cell = row.cells.find((item) => item.columnId === columnId);
  if (!cell) {
    return "";
  }
  if (typeof cell.displayValue === "string") {
    return cell.displayValue;
  }
  if (cell.value === null || cell.value === undefined) {
    return "";
  }
  return String(cell.value);
}

function toDateOrNull(input: string): string | null {
  const value = input.trim();
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

function clampPercent(input: string): number {
  const numeric = Number(input.toString().replace("%", "").trim());
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function extractTasks(sheet: SmartsheetSheet): ProjectTask[] {
  const taskCol = sheet.columns.find((col) =>
    matchesColumn(col.title, ["task", "任务", "name", "标题"]),
  );
  const ownerCol = sheet.columns.find((col) =>
    matchesColumn(col.title, ["owner", "assignee", "负责人", "责任人", "资源"]),
  );
  const statusCol = sheet.columns.find((col) =>
    matchesColumn(col.title, ["status", "状态", "进度状态"]),
  );
  const startCol = sheet.columns.find((col) =>
    matchesColumn(col.title, ["start", "开始"]),
  );
  const endCol = sheet.columns.find((col) =>
    matchesColumn(col.title, ["end", "finish", "due", "结束", "截止"]),
  );
  const progressCol = sheet.columns.find((col) =>
    matchesColumn(col.title, ["percent", "%", "progress", "完成率", "进度"]),
  );

  return sheet.rows
    .map((row) => {
      const name = taskCol ? getCellValue(row, taskCol.id).trim() : "";
      if (!name) {
        return null;
      }
      const owner = ownerCol ? getCellValue(row, ownerCol.id) : "";
      const status = statusCol ? getCellValue(row, statusCol.id) : "";
      const startRaw = startCol ? getCellValue(row, startCol.id) : "";
      const endRaw = endCol ? getCellValue(row, endCol.id) : "";
      const progressRaw = progressCol ? getCellValue(row, progressCol.id) : "";

      return {
        id: row.id,
        name,
        owner: owner || "未分配",
        status: status || "未更新",
        startDate: toDateOrNull(startRaw),
        endDate: toDateOrNull(endRaw),
        percentComplete: clampPercent(progressRaw),
        isKeyControl: name.trim().startsWith("*"),
      } satisfies ProjectTask;
    })
    .filter((task): task is ProjectTask => task !== null);
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const configuredIds = parseConfiguredSheetIds();
  if (configuredIds.length > 0) {
    const projects = await Promise.all(
      configuredIds.map(async (sheetId) => {
        const sheet = await smartsheetFetch<SmartsheetSheet>(`/sheets/${sheetId}`);
        return { id: sheet.id, name: sheet.name };
      }),
    );
    return projects;
  }

  const payload = await smartsheetFetch<{ data: Array<{ id: number; name: string }> }>(
    "/sheets?pageSize=50",
  );
  return payload.data.map((sheet) => ({ id: sheet.id, name: sheet.name }));
}

export async function getProjectData(sheetId: number): Promise<ProjectData> {
  const sheet = await smartsheetFetch<SmartsheetSheet>(`/sheets/${sheetId}`);
  return {
    id: sheet.id,
    name: sheet.name,
    tasks: extractTasks(sheet),
  };
}

export function toUiError(error: unknown): string {
  if (error instanceof SmartsheetApiError) {
    if (error.status === 401 || error.status === 403) {
      return "Smartsheet 鉴权失败，请检查 API Token。";
    }
    if (error.status === 404) {
      return "未找到对应 Smartsheet 项目，请检查 Sheet ID。";
    }
    return "Smartsheet 请求失败，请稍后重试。";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "发生未知错误。";
}
