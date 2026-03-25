// 项目相关类型
export interface Project {
  id: string;
  name: string;
  smartsheetUrl: string;
  googleSheetId?: string | null;
  totalBudget: number;
  salesForecast: number;
  status: "PLANNING" | "ACTIVE" | "COMPLETED" | "ON_HOLD";
  createdAt: Date;
  updatedAt: Date;
  actualSpend?: number;
  progress?: number;
  roi?: number;
  budgetConsumption?: number;
}

// 实际花费类型
export interface ActualSpend {
  id: string;
  projectId: string;
  date: Date;
  amount: number;
  category: "Tooling" | "Test Setup" | "Certification" | "BOM" | "Logistics";
  notes?: string | null;
  createdAt: Date;
}

// Google Sheet 数据类型
export interface GoogleSheetData {
  unitCost: number;
  toolingCost: number;
  volumeForecasts: number[];
  salesForecast: number;
}

// Smartsheet 进度数据类型
export interface SmartsheetProgress {
  sheetId: string;
  totalRows: number;
  completedRows: number;
  progress: number;
  milestones?: Milestone[];
}

export interface Milestone {
  name: string;
  status: "Not Started" | "In Progress" | "Completed";
  dueDate?: Date;
}

// 创建项目输入
export interface CreateProjectInput {
  name: string;
  smartsheetUrl: string;
  googleSheetId?: string;
  totalBudget: number;
  salesForecast: number;
}

// 创建花费输入
export interface CreateSpendInput {
  projectId: string;
  date: Date;
  amount: number;
  category: "Tooling" | "Test Setup" | "Certification" | "BOM" | "Logistics";
  notes?: string;
}

// Excel 导入数据
export interface ExcelSpendData {
  date: Date;
  amount: number;
  category: string;
  notes?: string;
}
