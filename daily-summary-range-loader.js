const source = await fetch("./daily-summary.js").then(response => response.text());
const patchedSource = source
    .replace('const dateInput = document.getElementById("reportDate");', 'const dateInput = document.getElementById("reportFromDate");\nconst toDateInput = document.getElementById("reportToDate");')
    .replace('const selectedDate = dateInput.value;', 'const selectedDate = dateInput.value;\n    const selectedToDate = toDateInput.value;')
    .replace('if (!selectedDate || !selectedUnit) {', 'if ((!selectedDate && !selectedToDate) || !selectedUnit) {')
    .replace('report.productionDate === selectedDate', '(!selectedDate || report.productionDate >= selectedDate) && (!selectedToDate || report.productionDate <= selectedToDate)')
    .replace('`${selectedDate} • ${selectedUnit}', '`${selectedDate || "Any Date"}${selectedToDate ? ` to ${selectedToDate}` : ""} • ${selectedUnit}')
    .replace('[dateInput, shiftInput, unitInput]', '[dateInput, toDateInput, shiftInput, unitInput]');
const blob = new Blob([patchedSource], { type: "text/javascript" });
await import(URL.createObjectURL(blob));
