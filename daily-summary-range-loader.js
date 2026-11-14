const fromDateInput = document.getElementById("reportFromDate");
const toDateInput = document.getElementById("reportToDate");
const unitInput = document.getElementById("unitFilter");
const shiftInput = document.getElementById("shiftFilter");

// Set the dashboard's initial filter to yesterday and Unit 2.
// Use local calendar fields to avoid UTC date shifts.
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const defaultDate = [
    yesterday.getFullYear(),
    String(yesterday.getMonth() + 1).padStart(2, "0"),
    String(yesterday.getDate()).padStart(2, "0")
].join("-");

if (fromDateInput && !fromDateInput.value) fromDateInput.value = defaultDate;
if (toDateInput && !toDateInput.value) toDateInput.value = defaultDate;
if (unitInput && !unitInput.value) unitInput.value = "Unit 2";
if (shiftInput && !shiftInput.value) shiftInput.value = "";

// Notify the Manager Dashboard filters if their listeners are already active.
[fromDateInput, toDateInput, unitInput, shiftInput].forEach(input => {
    if (input) input.dispatchEvent(new Event("change", { bubbles: true }));
});

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
