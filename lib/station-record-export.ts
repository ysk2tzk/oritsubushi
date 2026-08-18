import ExcelJS from "exceljs";
import type { StationRecordExportSheet } from "@/lib/domain";

const HEADER_FILL = "D9E1F2";
const ACHIEVED_FILL = "BFBFBF";
const BORDER_COLOR = "FF000000";
const DATA_START_ROW = 3;
const BLOCK_WIDTH = 4;
const BLOCK_GAP = 1;
const BASE_FONT = {
  name: "Noto Sans JP",
  size: 10
} as const;

function sanitizeSheetName(name: string) {
  const sanitized = name.replace(/[:\\/?*\[\]]/g, "_").trim();
  return (sanitized || "sheet").slice(0, 31);
}

function setExportDateCell(cell: ExcelJS.Cell, code: string | null) {
  if (!code) {
    cell.value = "";
    return;
  }

  if (code === "99999999") {
    cell.value = "不明";
    return;
  }

  const year = code.slice(0, 4);
  const month = code.slice(4, 6);
  const day = code.slice(6, 8);

  if (month === "99") {
    cell.value = `${year}年頃`;
    return;
  }

  if (day === "99") {
    cell.value = `${year}/${month}頃`;
    return;
  }

  cell.value = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0);
  cell.numFmt = "yyyy/mm/dd";
}

function formatDistance(distance: number | null) {
  if (distance === null) {
    return "距離未公表";
  }

  return Number(distance.toFixed(1));
}

function applyTitleStyle(cell: ExcelJS.Cell) {
  cell.font = { ...BASE_FONT };
  cell.alignment = {
    vertical: "middle",
    horizontal: "left",
    wrapText: false
  };
}

function applyHeaderStyle(cell: ExcelJS.Cell) {
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: HEADER_FILL }
  };
  cell.alignment = {
    vertical: "middle",
    horizontal: "left",
    wrapText: true
  };
  cell.border = {
    top: { style: "thin", color: { argb: BORDER_COLOR } },
    bottom: { style: "thin", color: { argb: BORDER_COLOR } },
    left: { style: "thin", color: { argb: BORDER_COLOR } },
    right: { style: "thin", color: { argb: BORDER_COLOR } }
  };
  cell.font = { ...BASE_FONT, bold: true };
}

function getTextWidth(text: string) {
  const getVisualWidth = (line: string) =>
    Array.from(line).reduce((total, char) => total + (char.charCodeAt(0) > 255 ? 2 : 1), 0);
  const maxLineLength = text.split("\n").reduce((max, line) => Math.max(max, getVisualWidth(line)), 0);
  return Math.min(Math.max(maxLineLength * 1.15 + 3, 8), 80);
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

function getCellDisplayText(cell: ExcelJS.Cell) {
  if (cell.value instanceof Date) {
    return formatDateValue(cell.value);
  }

  return cell.text || "";
}

function styleDataBlock(worksheet: ExcelJS.Worksheet, startColumn: number, rowCount: number) {
  const lastRow = Math.max(DATA_START_ROW, DATA_START_ROW + rowCount - 1);

  for (let rowNumber = DATA_START_ROW; rowNumber <= lastRow; rowNumber += 1) {
    for (let offset = 0; offset < BLOCK_WIDTH; offset += 1) {
      const column = startColumn + offset;
      const cell = worksheet.getCell(rowNumber, column);
      cell.font = { ...BASE_FONT };
      cell.alignment =
        offset === 1
          ? {
              vertical: "middle",
              horizontal: "right",
              wrapText: false
            }
          : offset === 2
            ? {
                vertical: "middle",
                wrapText: false
              }
            : {
                vertical: "middle",
                horizontal: "left",
                wrapText: false
              };
      cell.border = {
        top: {
          style: rowNumber === DATA_START_ROW ? "thin" : "dashed",
          color: { argb: BORDER_COLOR }
        },
        bottom: {
          style: rowNumber === lastRow ? "thin" : "dashed",
          color: { argb: BORDER_COLOR }
        },
        left: { style: "thin", color: { argb: BORDER_COLOR } },
        right: { style: "thin", color: { argb: BORDER_COLOR } }
      };
    }
  }
}

export async function buildStationRecordWorkbook(sheets: StationRecordExportSheet[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "oritsubushi";
  workbook.created = new Date();

  for (const sheetData of sheets) {
    const worksheet = workbook.addWorksheet(sanitizeSheetName(sheetData.name));
    worksheet.views = [{ state: "frozen", ySplit: 2 }];

    for (const [lineIndex, line] of sheetData.lines.entries()) {
      const startColumn = 1 + lineIndex * (BLOCK_WIDTH + BLOCK_GAP);
      const endColumn = startColumn + BLOCK_WIDTH - 1;
      const lineTitle =
        line.companyType === 5 ? `${line.companyName} ${line.name}` : line.name;

      worksheet.getCell(1, startColumn).value = lineTitle;
      worksheet.getCell(2, startColumn).value = "駅名";
      worksheet.getCell(2, startColumn + 1).value = "駅間\n距離";
      worksheet.getCell(2, startColumn + 2).value = "乗降車日";
      worksheet.getCell(2, startColumn + 3).value = "備考";

      for (let column = startColumn; column <= endColumn; column += 1) {
        applyTitleStyle(worksheet.getCell(1, column));
      }
      for (let column = startColumn; column <= endColumn; column += 1) {
        applyHeaderStyle(worksheet.getCell(2, column));
      }

      for (let index = 0; index < line.items.length; index += 1) {
        const item = line.items[index];
        const rowNumber = DATA_START_ROW + index;
        const achieved = item.firstAchievedOn !== null;

        if (item.type === "station") {
          worksheet.getCell(rowNumber, startColumn).value = item.name;
          setExportDateCell(worksheet.getCell(rowNumber, startColumn + 2), item.firstAchievedOn);
          worksheet.getCell(rowNumber, startColumn + 3).value = item.note ?? "";
        } else {
          worksheet.getCell(rowNumber, startColumn + 1).value = formatDistance(item.distance);
          setExportDateCell(worksheet.getCell(rowNumber, startColumn + 2), item.firstAchievedOn);
          worksheet.getCell(rowNumber, startColumn + 3).value = item.note ?? "";

          if (item.distance !== null) {
            const distanceCell = worksheet.getCell(rowNumber, startColumn + 1);
            distanceCell.numFmt = "0.0";
            distanceCell.alignment = {
              vertical: "middle",
              horizontal: "right",
              wrapText: false
            };
          }
        }

        if (achieved) {
          for (let column = startColumn; column <= endColumn; column += 1) {
            worksheet.getCell(rowNumber, column).fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: ACHIEVED_FILL }
            };
          }
        }
      }

      styleDataBlock(worksheet, startColumn, line.items.length);
    }

    const totalColumns = Math.max(worksheet.columnCount, sheetData.lines.length * (BLOCK_WIDTH + BLOCK_GAP) - 1);
    for (let index = 0; index < totalColumns; index += 1) {
      const column = worksheet.getColumn(index + 1);
      const columnNumber = index + 1;
      const relativePosition = (columnNumber - 1) % (BLOCK_WIDTH + BLOCK_GAP);

      if (relativePosition === BLOCK_WIDTH) {
        column.width = 1;
        continue;
      }

      let width = 6;
      column.eachCell({ includeEmpty: true }, (cell) => {
        width = Math.max(width, getTextWidth(getCellDisplayText(cell)));
      });

      if (relativePosition === 1 && width < 8) {
        width = 8;
      }

      column.width = width;
    }

    worksheet.getRow(2).height = 34;
  }

  return workbook;
}
