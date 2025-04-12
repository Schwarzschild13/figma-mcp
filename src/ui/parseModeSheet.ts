import * as XLSX from "xlsx";

export interface ThemeData {
  [token: string]: string;
}

export function parseModeSheet(
  file: File
): Promise<{ [mode: string]: ThemeData }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
        }) as string[][];

        const [headers, ...rows] = jsonData;
        const modes = headers.slice(1);
        const parsedData: { [mode: string]: ThemeData } = {};

        modes.forEach((mode) => {
          parsedData[mode] = {};
        });

        rows.forEach((row) => {
          const token = row[0];
          if (!token) return;
          modes.forEach((mode, index) => {
            const value = row[index + 1];
            if (value) {
              parsedData[mode][token.toLowerCase().trim()] = value;
            }
          });
        });

        resolve(parsedData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
