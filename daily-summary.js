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
    Printing: ["Printing 3", "Printing 4"],
    Lamination: ["Lamination 3", "Lamination 4", "Lamination 5"],
    Slitting: ["Slitting 5", "Slitting 6", "Slitting 7"]
};
const shifts = ["1st", "2nd", "3rd"];

function machinesOf(report) {
    return Array.isArray(report.machines)
        ? report.machines
        : Object.values(report.machines || {});
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
    Object.values(processMachines).flat().forEach(machine => {
        totals[machine] = {
            "1st": { length: 0, weight: 0 },
            "2nd": { length: 0, weight: 0 },
            "3rd": { length: 0, weight: 0 },
            all: { length: 0, weight: 0 }
        };
    });
    return totals;
}

function renderDailyTable() {
    const selectedDate = dateInput.value;
    const selectedUnit = unitInput.value;
    const selectedShift = shiftInput.value;

    if (!selectedDate || !selectedUnit) {
        info.textContent = "Select date and unit";
        container.innerHTML = '<p class="empty-message">Select a date and unit to view the table.</p>';
        return;
    }

    const totals = createTotals();
    let reportCount = 0;

    reports
        .filter(report => report.productionDate === selectedDate && report.unit === selectedUnit)
        .forEach(report => {
            if (selectedShift && report.shift !== selectedShift) return;
            reportCount++;

            machinesOf(report).forEach(machine => {
                const machineTotal = totals[machine.machine];
                if (!machineTotal || String(machine.status || "Production").toLowerCase() !== "production") return;

                const shift = shifts.includes(report.shift) ? report.shift : null;
                if (!shift) return;

                const length = value(machine.length);
                const weight = value(machine.weight);
                machineTotal[shift].length += length;
                machineTotal[shift].weight += weight;
                machineTotal.all.length += length;
                machineTotal.all.weight += weight;
            });
        });

    info.textContent = `${selectedDate} • ${selectedUnit}${selectedShift ? ` • ${selectedShift} Shift` : " • All Shifts"} • ${reportCount} report(s)`;

    const rows = Object.entries(processMachines).map(([process, machines]) => {
        const processTotal = { length: 0, weight: 0 };
        const shiftTotals = Object.fromEntries(shifts.map(shift => [shift, { length: 0, weight: 0 }]));

        machines.forEach(machine => {
            shifts.forEach(shift => {
                shiftTotals[shift].length += totals[machine][shift].length;
                shiftTotals[shift].weight += totals[machine][shift].weight;
            });
            processTotal.length += totals[machine].all.length;
            processTotal.weight += totals[machine].all.weight;
        });

        return `<tr>
            <td>${process} Total</td>
            ${shifts.map(shift => `<td>${format(shiftTotals[shift].length)} m</td><td>${format(shiftTotals[shift].weight)} kg</td>`).join("")}
            <td class="total-column">${format(processTotal.length)} m</td><td class="total-column">${format(processTotal.weight)} kg</td>
        </tr>`;
    }).join("");

    const shiftHeadings = shifts.map(shift => `<th class="shift-heading" colspan="2">${shift} Shift</th>`).join("");
    const unitHeadings = shifts.map(() => `<th class="unit-heading">Mtr</th><th class="unit-heading">Kg</th>`).join("");

    container.innerHTML = `<div class="daily-table-wrapper">
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
            <tbody>${rows}</tbody>
        </table>
    </div>`;
}

[dateInput, shiftInput, unitInput].forEach(element => element.addEventListener("change", renderDailyTable));

onValue(ref(db, "productionReports"), snapshot => {
    const data = snapshot.val() || {};
    reports = Object.values(data);
    renderDailyTable();
}, error => {
    console.error("Daily summary Firebase error:", error);
    container.innerHTML = '<p class="error-message">Unable to load daily production summary.</p>';
});
