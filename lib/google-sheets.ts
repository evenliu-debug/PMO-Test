import { GoogleSpreadsheet } from "google-spreadsheet";
import { GoogleSheetData } from "./types";

// 解析 Smartsheet URL 获取 Sheet ID
export function extractSmartsheetId(url: string): string {
  const match = url.match(/\/sheets\/([a-zA-Z0-9]+)/);
  return match ? match[1] : "";
}

// Google Sheets 认证和服务
export class GoogleSheetsService {
  private static instance: GoogleSheetsService;
  private doc: GoogleSpreadsheet | null = null;

  private constructor() {}

  public static getInstance(): GoogleSheetsService {
    if (!GoogleSheetsService.instance) {
      GoogleSheetsService.instance = new GoogleSheetsService();
    }
    return GoogleSheetsService.instance;
  }

  private async getDoc(sheetId: string): Promise<GoogleSpreadsheet> {
    if (this.doc && this.doc.spreadsheetId === sheetId) {
      return this.doc;
    }

    const doc = new GoogleSpreadsheet(sheetId);

    // 使用服务账号认证
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "",
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n") || "",
    });

    await doc.loadInfo();
    this.doc = doc;
    return doc;
  }

  // 读取指定 Sheet 的数据
  async readSheetData(sheetId: string, sheetTitle: string): Promise<any[]> {
    try {
      const doc = await this.getDoc(sheetId);
      const sheet = doc.sheetsByTitle[sheetTitle];

      if (!sheet) {
        throw new Error(`Sheet "${sheetTitle}" not found`);
      }

      const rows = await sheet.getRows();
      return rows.map((row) => row.toObject());
    } catch (error) {
      console.error("Error reading Google Sheet:", error);
      throw error;
    }
  }

  // 解析 MS2 Readout 格式的表格
  async parseMS2Readout(sheetId: string): Promise<GoogleSheetData> {
    try {
      const doc = await this.getDoc(sheetId);

      // 尝试读取主表
      const sheet = doc.sheetsByIndex[0];
      const rows = await sheet.getRows();

      let unitCost = 0;
      let toolingCost = 0;
      let volumeForecasts: number[] = [];
      let salesForecast = 0;

      // 简单解析逻辑 - 实际使用时需要根据具体表格结构调整
      for (const row of rows) {
        const rowObj = row.toObject();

        // 查找 Unit Cost
        if (rowObj["Unit Cost"]) {
          unitCost = parseFloat(rowObj["Unit Cost"]) || 0;
        }

        // 查找 Tooling Cost
        if (rowObj["Tooling Cost"]) {
          toolingCost = parseFloat(rowObj["Tooling Cost"]) || 0;
        }

        // 查找 Volume Forecast
        if (rowObj["Volume"] || rowObj["Forecast"]) {
          const volume = parseFloat(rowObj["Volume"] || rowObj["Forecast"]) || 0;
          if (volume > 0) {
            volumeForecasts.push(volume);
          }
        }
      }

      // 计算销售预测总额
      if (volumeForecasts.length > 0 && unitCost > 0) {
        salesForecast = volumeForecasts.reduce((sum, vol) => sum + vol, 0) * unitCost;
      }

      return {
        unitCost,
        toolingCost,
        volumeForecasts,
        salesForecast,
      };
    } catch (error) {
      console.error("Error parsing MS2 Readout:", error);
      throw error;
    }
  }

  // 列出文件夹中的所有表格
  async listFilesInFolder(folderId: string): Promise<any[]> {
    // 注意: 需要 Google Drive API 权限,这里提供基本实现
    // 实际使用时可能需要使用 googleapis 库的 drive API
    console.log("Listing files in folder:", folderId);
    return [];
  }

  // 获取表格元数据
  async getSheetMetadata(sheetId: string): Promise<any> {
    const doc = await this.getDoc(sheetId);
    return {
      id: doc.spreadsheetId,
      title: doc.title,
      sheetCount: doc.sheetCount,
      sheets: doc.sheetsByIndex.map((s) => ({
        title: s.title,
        rowCount: s.rowCount,
      })),
    };
  }
}

export const googleSheetsService = GoogleSheetsService.getInstance();
