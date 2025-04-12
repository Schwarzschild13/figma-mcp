import React, { useState } from "react";
import * as XLSX from "xlsx";

interface ThemeData {
  [token: string]: string;
}

const App: React.FC = () => {
  const [themeData, setThemeData] = useState<{ [mode: string]: ThemeData }>({});
  const [selectedMode, setSelectedMode] = useState<string>("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
      }) as string[][];

      // Assuming the first row contains headers: ['Token', 'Light', 'Dark', ...]
      const [headers, ...rows] = jsonData;
      const modes = headers.slice(1); // ['Light', 'Dark', ...]
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

      setThemeData(parsedData);
      setSelectedMode(modes[0]);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleApply = () => {
    if (!selectedMode || !themeData[selectedMode]) return;
    parent.postMessage(
      {
        pluginMessage: {
          type: "apply-mode",
          mode: selectedMode,
          colors: themeData[selectedMode],
        },
      },
      "*"
    );
  };

  return (
    <div style={{ padding: "16px", fontFamily: "sans-serif" }}>
      <h2>Theme Switcher</h2>
      <input type="file" accept=".xlsx" onChange={handleFileUpload} />
      {Object.keys(themeData).length > 0 && (
        <>
          <div style={{ marginTop: "16px" }}>
            <label htmlFor="mode-select">Select Mode:</label>
            <select
              id="mode-select"
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              style={{ marginLeft: "8px" }}
            >
              {Object.keys(themeData).map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>
          <button onClick={handleApply} style={{ marginTop: "16px" }}>
            Apply Theme
          </button>
        </>
      )}
    </div>
  );
};

export default App;
