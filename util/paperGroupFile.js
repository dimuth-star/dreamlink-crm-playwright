const ExcelJS = require("exceljs");

// Builds `count` template rows with unique group names: "<baseName> <stamp>-<n>".
// Column order must match the Paper Groups template headers.
function buildPaperGroupRows({ baseName, stamp, count, defaults }) {
  const names = [];
  const rows = [];
  for (let i = 1; i <= count; i++) {
    const name = `${baseName} ${stamp}-${i}`;
    names.push(name);
    rows.push([
      name,
      defaults.region,
      defaults.district,
      defaults.village,
      defaults.cycleNumber,
      defaults.contactName,
      defaults.phoneNumber,
      defaults.contactPosition,
      defaults.previousShareOutValue,
      defaults.memberCount,
    ]);
  }
  return { names, rows };
}

async function writePaperGroupsFile(filePath, headers, rows) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");
  sheet.addRow(headers);
  rows.forEach((row) => sheet.addRow(row));
  await workbook.xlsx.writeFile(filePath);
  return filePath;
}

async function readHeaderRow(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.worksheets[0];
  // ExcelJS row.values is 1-indexed (index 0 is empty)
  return sheet.getRow(1).values.slice(1);
}

module.exports = { buildPaperGroupRows, writePaperGroupsFile, readHeaderRow };
