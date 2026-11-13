import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBVdV7BKtw1lBexUBSM90l2gRmg2vNE7RY",
    authDomain: "apex-production-report-90e12.firebaseapp.com",
    databaseURL: "https://apex-production-report-90e12-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "apex-production-report-90e12",
    storageBucket: "apex-production-report-90e12.firebasestorage.app",
    messagingSenderId: "857344599590",
    appId: "1:857344599590:web:d002e55d68d896afe0e8e7"
};

const db = getDatabase(initializeApp(firebaseConfig));
const dateInput = document.getElementById("reportDate");
const shiftInput = document.getElementById("shiftFilter");
const unitInput = document.getElementById("unitFilter");
const container = document.getElementById("dailyProductionContainer");
const info = document.getElementById("dailyProductionInfo");
let reports = [];

const processMachines = {
    Printing: ["Printing 1", "Printing 2"],
    Lamination: ["Lamination 1", "Lamination 2"],
    "Extrusion Coating": ["Extrusion Coating 1"],
    Slitting: ["Slitting 3", "Slitting 4"],
    Doctoring: ["Doctoring 1", "Doctoring 2"],
    Inspection: ["Inspection 1"]
};

const unit2ProcessMachines = {
    Printing: ["Printing 3", "Printing 4"],
    Lamination: ["Lamination 3", "Lamination 4", "Lamination 5"],
    ColdSeal: ["ColdSeal"],
    Slitting: ["Slitting 5", "Slitting 6", "Slitting 7"],
    Doctoring: ["Doctoring 3", "Doctoring 4", "Doctoring 5"],
    Inspection: ["Inspection 2"]
};

const shifts = ["1st", "2nd", "3rd"];

function machinesOf(report) {
    return Array.isArray(report.machines) ? report.machines : Object.values(report.machines || {});
}

function value(input) {
    const number = Number(input);
    return Number.isFinite(number) ? number : 0;
}

function format(number) {
    return number.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function createTotals() {
    const totals = {};

    Object.values(processMachines)
        .flat()
        .concat(Object.values(unit2ProcessMachines).flat())
        .forEach(machine => {
            totals[machine] = {
                "1st": { length: 0, weight: 0, reels: 0, hold_reels: 0, totalCoils: 0 },
                "2nd": { length: 0, weight: 0, reels: 0, hold_reels: 0, totalCoils: 0 },
                "3rd": { length: 0, weight: 0, reels: 0, hold_reels: 0, totalCoils: 0 },
                all: { length: 0, weight: 0, reels: 0, hold_reels: 0, totalCoils: 0 }
            };
        });

    return totals;
}

function printDailySummary() {
    const wrapper = container.querySelector(".daily-table-wrapper");
    if (!wrapper) {
        alert("No table data available to print.");
        return;
    }

    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) {
        alert("Please allow pop-ups to print the report.");
        return;
    }

    const titleText = info ? info.textContent : "Daily Production Summary";

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Apex Daily Production Summary</title>
            <style>
                * { box-sizing: border-box; }
                body { font-family: Arial, sans-serif; margin: 20px; color: #000; }
                .summary-header { text-align: center; margin-bottom: 20px; }
                .summary-header h2 { margin: 0 0 5px 0; font-size: 20px; }
                .summary-header p { margin: 0; font-size: 14px; color: #555; }
                .daily-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                .daily-table th, .daily-table td { border: 1px solid #000; padding: 8px; font-size: 12px; text-align: center; }
                .daily-table th { background: #f2f2f2; font-weight: bold; }
                .total-column { background-color: #f9f9f9; font-weight: bold; }
                .extra-metric-row td { font-weight: bold; }
                @page { size: A4 landscape; margin: 10mm; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <div class="summary-header">
                <h2>APEX PRODUCTION - DAILY SUMMARY REPORT</h2>
                <p>${titleText}</p>
            </div>
            ${wrapper.outerHTML}
        </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.focus();
}

function renderDailyTable() {
    const selectedDate = dateInput.value;
    const selectedUnit = unitInput.value;
    const selectedShift = shiftInput.value;

    const selectedProcessMachines = selectedUnit === "Unit 1" ? processMachines : unit2ProcessMachines;

    if (!selectedDate || !selectedUnit) {
        info.textContent = "Select date and unit";
        container.innerHTML = '<p class="empty-message">Select a date and unit to view the table.</p>';
        return;
    }

    const totals = createTotals();
    let reportCount = 0;

    reports.filter(report => report.productionDate === selectedDate && report.unit === selectedUnit).forEach(report => {
        if (selectedShift && report.shift !== selectedShift) return;
        reportCount++;

        machinesOf(report).forEach(machine => {
            const machineTotal = totals[machine.machine];
            if (!machineTotal || String(machine.status || "Production").toLowerCase() !== "production") return;

            const shift = shifts.includes(report.shift) ? report.shift : null;
            if (!shift) return;

            const length = value(machine.length);
            const weight = value(machine.weight);
            const reels = value(machine.reels);
            const holdReels = value(machine.hold_reels);
            const coils = value(machine.totalCoils);

            machineTotal[shift].length += length;
            machineTotal[shift].weight += weight;
            machineTotal[shift].reels += reels;
            machineTotal[shift].hold_reels += holdReels;
            machineTotal[shift].totalCoils += coils;

            machineTotal.all.length += length;
            machineTotal.all.weight += weight;
            machineTotal.all.reels += reels;
            machineTotal.all.hold_reels += holdReels;
            machineTotal.all.totalCoils += coils;
        });
    });

    info.textContent = `${selectedDate} • ${selectedUnit}${selectedShift ? ` • ${selectedShift} Shift` : " • All Shifts"} • ${reportCount} report(s)`;

    const rows = Object.entries(selectedProcessMachines)
        .filter(([process]) => process !== "Doctoring")
        .map(([process, machines], processIndex) => {
            const processTotal = { length: 0, weight: 0 };
            const shiftTotals = Object.fromEntries(shifts.map(shift => [shift, { length: 0, weight: 0 }]));

            machines.forEach(machine => {
                shifts.forEach(shift => {
                    if (totals[machine]) {
                        shiftTotals[shift].length += totals[machine][shift].length;
                        shiftTotals[shift].weight += totals[machine][shift].weight;
                    }
                });
                if (totals[machine]) {
                    processTotal.length += totals[machine].all.length;
                    processTotal.weight += totals[machine].all.weight;
                }
            });

            const detailId = `process-machine-details-${processIndex}`;
            const machineRows = machines.map(machine => {
                const machineTotal = totals[machine];
                return `
                    <tr class="machine-detail-row" data-detail-id="${detailId}" hidden>
                        <td class="machine-name">${machine}</td>
                        ${shifts.map(shift => `
                            <td>${format(machineTotal[shift].length)} m</td>
                            <td>${format(machineTotal[shift].weight)} kg</td>
                        `).join("")}
                        <td class="total-column">${format(machineTotal.all.length)} m</td>
                        <td class="total-column">${format(machineTotal.all.weight)} kg</td>
                    </tr>
                `;
            }).join("");

            return `
                <tr class="process-total-row">
                    <td>
                        <button class="process-toggle" type="button" aria-expanded="false" aria-controls="${detailId}" aria-label="Show ${process} machine totals">
                            <span class="process-toggle-icon" aria-hidden="true">▸</span>
                        </button>
                        ${process} Total
                    </td>
                    ${shifts.map(shift => `
                        <td>${format(shiftTotals[shift].length)} m</td>
                        <td>${format(shiftTotals[shift].weight)} kg</td>
                    `).join("")}
                    <td class="total-column">${format(processTotal.length)} m</td>
                    <td class="total-column">${format(processTotal.weight)} kg</td>
                </tr>
                ${machineRows}
            `;
        }).join("");

    const slittingMachines = selectedProcessMachines.Slitting || [];
    const doctoringMachines = selectedProcessMachines.Doctoring || [];

    const renderExtraMetricRow = (label, machines, metricKey, detailId) => {
        const shiftSums = Object.fromEntries(shifts.map(shift => [shift, 0]));
        let overallSum = 0;

        machines.forEach(machine => {
            if (!totals[machine]) return;
            shifts.forEach(shift => { shiftSums[shift] += totals[machine][shift][metricKey]; });
            overallSum += totals[machine].all[metricKey];
        });

        const machineRows = machines.map(machine => {
            const machineTotal = totals[machine];
            return `
                <tr class="machine-detail-row metric-machine-detail-row" data-detail-id="${detailId}" hidden>
                    <td class="machine-name">${machine}</td>
                    ${shifts.map(shift => `<td colspan="2">${format(machineTotal[shift][metricKey])} Nos</td>`).join("")}
                    <td colspan="2" class="total-column">${format(machineTotal.all[metricKey])} Nos</td>
                </tr>
            `;
        }).join("");

        return `
            <tr class="extra-metric-row">
                <td>
                    <button class="process-toggle" type="button" aria-expanded="false" aria-controls="${detailId}" aria-label="Show machine-wise ${label.toLowerCase()}">
                        <span class="process-toggle-icon" aria-hidden="true">▸</span>
                    </button>
                    <strong>${label}</strong>
                </td>
                ${shifts.map(shift => `<td colspan="2" style="text-align: center;">${format(shiftSums[shift])} Nos</td>`).join("")}
                <td colspan="2" class="total-column" style="text-align: center;">${format(overallSum)} Nos</td>
            </tr>
            ${machineRows}
        `;
    };

    const extraRows = `
        ${renderExtraMetricRow("Total Reels", slittingMachines, "reels", "metric-reels-details")}
        ${renderExtraMetricRow("Total Hold Reels", slittingMachines, "hold_reels", "metric-hold-reels-details")}
        ${renderExtraMetricRow("Total Doctoring Coils", doctoringMachines, "totalCoils", "metric-doctoring-coils-details")}
    `;

    const shiftHeadings = shifts.map(shift => `<th class="shift-heading" colspan="2">${shift} Shift</th>`).join("");
    const unitHeadings = shifts.map(() => `<th class="unit-heading">Mtr</th><th class="unit-heading">Kg</th>`).join("");

    container.innerHTML = `
        <div style="position: relative; width: 100%;">
            <button id="printDailySummaryBtn" class="report-action-btn print-btn" title="Print Summary" aria-label="Print Summary" style="position: absolute; top: -45px; right: 0; z-index: 10;">
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
                    <path d="M19 8H5c-1.66 0-3 1.34-3 3v4h4v4h12v-4h4v-4c0-1.66-1.34-3-3-3zm-3 9H8v-5h8v5zm3-5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-2-9H6v4h12V3z"></path>
                </svg>
            </button>
            <div class="daily-table-wrapper">
                <table class="daily-table">
                    <thead>
                        <tr>
                            <th rowspan="2">Production</th>
                            ${shiftHeadings}
                            <th class="total-column" colspan="2">All Shift Total</th>
                        </tr>
                        <tr>
                            ${unitHeadings}
                            <th class="unit-heading total-column">Mtr</th>
                            <th class="unit-heading total-column">Kg</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                        ${extraRows}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    container.querySelectorAll(".process-toggle").forEach(button => {
        button.addEventListener("click", () => {
            const isExpanded = button.getAttribute("aria-expanded") === "true";
            const detailId = button.getAttribute("aria-controls");
            container.querySelectorAll(`[data-detail-id="${detailId}"]`).forEach(row => {
                row.hidden = isExpanded;
            });
            button.setAttribute("aria-expanded", String(!isExpanded));
            const label = button.getAttribute("aria-label").replace(/^(Show|Hide) /, "");
            button.setAttribute("aria-label", `${isExpanded ? "Show" : "Hide"} ${label}`);
        });
    });

    const printBtn = document.getElementById("printDailySummaryBtn");
    if (printBtn) printBtn.addEventListener("click", printDailySummary);
}

[dateInput, shiftInput, unitInput].forEach(element => {
    if (element) element.addEventListener("change", renderDailyTable);
});

onValue(ref(db, "productionReports"), snapshot => {
    const data = snapshot.val();
    reports = data ? Object.values(data) : [];
    renderDailyTable();
}, error => {
    console.error("Daily summary Firebase error:", error);
    container.innerHTML = '<p class="error-message">Unable to load daily production summary.</p>';
});
