import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getDatabase,
    ref,
    onValue,
    set,
    get,
    child
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";


// =====================================================
// FIREBASE CONFIGURATION
// =====================================================

const firebaseConfig = {
    apiKey: "AIzaSyBVdV7BKtw1lBexUBSM90l2gRmg2vNE7RY",
    authDomain: "apex-production-report-90e12.firebaseapp.com",
    databaseURL: "https://apex-production-report-90e12-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "apex-production-report-90e12",
    storageBucket: "apex-production-report-90e12.firebasestorage.app",
    messagingSenderId: "857344599590",
    appId: "1:857344599590:web:d002e55d68d896afe0e8e7"
};

// =====================================================
// FIREBASE INITIALIZATION
// =====================================================

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const reportsRef = ref(db, "productionReports");


// =====================================================
// HTML ELEMENTS
// =====================================================

const reportDate = document.getElementById("reportDate");
const shiftFilter = document.getElementById("shiftFilter");
const unitFilter = document.getElementById("unitFilter");

const showAllReports = document.getElementById("showAllReports");
const clearFilters = document.getElementById("clearFilters");
const refreshReports = document.getElementById("refreshReports");
const addTargetBtn = document.getElementById("addTargetBtn");

const reportsContainer = document.getElementById("reportsContainer");
const loadingMessage = document.getElementById("loadingMessage");

const reportCount = document.getElementById("reportCount");
const machineCount = document.getElementById("machineCount");
const productionCount = document.getElementById("productionCount");
const idleCount = document.getElementById("idleCount");

// Target Modal Elements
const targetModal = document.getElementById("targetModal");
const closeTargetModal = document.getElementById("closeTargetModal");
const saveTargetBtn = document.getElementById("saveTargetBtn");
const cancelTargetBtn = document.getElementById("cancelTargetBtn");
const targetDate = document.getElementById("targetDate");
const targetUnit = document.getElementById("targetUnit");
const targetProcessContainer = document.getElementById("targetProcessContainer");
const targetContainer = document.getElementById("targetContainer");
const targetCard = document.querySelector(".target-card");
const targetInfo = document.getElementById("targetInfo");


// =====================================================
// GLOBAL VARIABLES
// =====================================================

let allReports = [];

// Unit processes configuration
const unitProcesses = {
    "Unit 1": ["Printing", "Lamination", "Extrusion", "Slitting"],
    "Unit 2": ["Printing", "Lamination", "ColdSeal", "Slitting"]
};

// Process color mapping
const processColors = {
    "Printing": "printing-bar",
    "Lamination": "lamination-bar",
    "Extrusion": "extrusion-bar",
    "Slitting": "slitting-bar",
    "ColdSeal": "coldseal-bar",
    "Cold Seal": "coldseal-bar"
};


// =====================================================
// TARGET MODAL MANAGEMENT
// =====================================================

function openTargetModal() {
    if (!targetModal) return;
    
    // Default target modal date to currently selected filter date or today
    const selectedDate = reportDate ? reportDate.value : "";
    const today = new Date().toISOString().split('T')[0];
    
    if (targetDate) targetDate.value = selectedDate || today;
    if (targetUnit) targetUnit.value = unitFilter ? unitFilter.value : "";
    
    populateProcessInputs();
    targetModal.classList.remove("hidden");
}

function closeTargetModalFunc() {
    if (!targetModal) return;
    targetModal.classList.add("hidden");
    if (targetProcessContainer) targetProcessContainer.innerHTML = "";
}

function populateProcessInputs() {
    if (!targetUnit || !targetProcessContainer) return;
    
    const selectedUnit = targetUnit.value;
    targetProcessContainer.innerHTML = "";
    
    if (!selectedUnit) return;
    
    const processes = unitProcesses[selectedUnit] || [];
    
    processes.forEach(process => {
        const group = document.createElement("div");
        group.className = "process-input-group";
        
        group.innerHTML = `
            <label>${escapeHTML(process)}</label>
            <input type="number" data-process="${escapeHTML(process)}" placeholder="Enter target (kg)" min="0" step="any">
        `;
        
        targetProcessContainer.appendChild(group);
    });
}

function saveTarget() {
    if (!targetDate || !targetUnit || !targetProcessContainer) return;

    const date = targetDate.value;
    const unit = targetUnit.value;
    
    if (!date || !unit) {
        alert("Please select both date and unit");
        return;
    }
    
    const targets = {};
    let hasTarget = false;
    
    targetProcessContainer.querySelectorAll("input").forEach(input => {
        const process = input.dataset.process;
        const value = parseFloat(input.value);
        
        if (!isNaN(value) && value > 0) {
            targets[process] = value;
            hasTarget = true;
        }
    });
    
    if (!hasTarget) {
        alert("Please enter at least one target value greater than 0");
        return;
    }
    
    const targetKey = `${date}_${unit}`;
    const targetPath = `productionTargets/${targetKey}`;
    
    set(ref(db, targetPath), {
        date: date,
        unit: unit,
        targets: targets,
        timestamp: Date.now()
    }).then(() => {
        alert("Target saved successfully!");
        closeTargetModalFunc();
        displayTargets(date, unit);
    }).catch(error => {
        console.error("Error saving target:", error);
        alert("Error saving target");
    });
}


// =====================================================
// DISPLAY TARGETS AND ACHIEVEMENT BARS
// =====================================================

function displayTargets(date, unit) {
    if (!targetCard) return;

    if (!date || !unit) {
        targetCard.classList.add("hidden");
        return;
    }
    
    targetCard.classList.remove("hidden");
    
    const targetKey = `${date}_${unit}`;
    const targetPath = `productionTargets/${targetKey}`;
    
    get(child(ref(db), targetPath)).then(snapshot => {
        if (!snapshot.exists()) {
            if (targetContainer) {
                targetContainer.innerHTML = '<p class="empty-message">No targets set for this date and unit.</p>';
            }
            if (targetInfo) {
                targetInfo.textContent = `${formatDate(date)} - ${unit}`;
            }
            return;
        }
        
        const targetData = snapshot.val();
        if (targetContainer) targetContainer.innerHTML = "";
        
        const filteredReports = allReports.filter(report => 
            report.productionDate === date && report.unit === unit
        );
        
        const achievements = calculateAchievements(filteredReports, targetData.targets || {});
        
        Object.entries(targetData.targets || {}).forEach(([process, targetValue]) => {
            const achievement = achievements[process] || 0;
            const percentage = targetValue > 0 ? (achievement / targetValue) * 100 : 0;
            const percentageLabel = Math.round(percentage);
            const barWidth = Math.min(Math.max(percentage, 0), 100);
            
            const item = document.createElement("div");
            item.className = "target-item";
            
            const colorClass = processColors[process] || "printing-bar";
            
            item.innerHTML = `
                <div class="target-process-name">${escapeHTML(process)}</div>
                <div class="target-bar-container">
                    <div class="target-bar-fill ${colorClass}" style="width: ${barWidth}%">
                        ${percentageLabel}%
                    </div>
                </div>
                <div class="target-stats">
                    <span>Achieved: ${achievement.toFixed(2)} kg</span>
                    <span>Target: ${targetValue} kg</span>
                    <span>Remaining: ${Math.max(0, (targetValue - achievement)).toFixed(2)} kg</span>
                </div>
            `;
            
            if (targetContainer) targetContainer.appendChild(item);
        });
        
        if (targetInfo) {
            targetInfo.textContent = `${formatDate(date)} - ${unit}`;
        }
        
    }).catch(error => {
        console.error("Error loading targets:", error);
        if (targetContainer) {
            targetContainer.innerHTML = '<p class="empty-message">Error loading targets.</p>';
        }
    });
}

function calculateAchievements(reports, targets) {
    const achievements = {};
    
    Object.keys(targets).forEach(process => {
        achievements[process] = 0;
    });
    
    reports.forEach(report => {
        const machines = Array.isArray(report.machines)
            ? report.machines
            : Object.values(report.machines || {});
        
        machines.forEach(machine => {
            const process = machine.process || "Other";
            const weight = parseFloat(machine.weight) || 0;
            
            // Match exactly or normalize process names
            if (achievements.hasOwnProperty(process)) {
                achievements[process] += weight;
            } else {
                // Check case-insensitive / normalized key matching
                const key = Object.keys(achievements).find(
                    k => k.toLowerCase().replace(/\s+/g, '') === process.toLowerCase().replace(/\s+/g, '')
                );
                if (key) {
                    achievements[key] += weight;
                }
            }
        });
    });
    
    return achievements;
}


// =====================================================
// LOAD REPORTS FROM FIREBASE
// =====================================================

function loadReports() {
    if (loadingMessage) loadingMessage.textContent = "Loading...";

    onValue(
        reportsRef,
        (snapshot) => {
            const data = snapshot.val();

            if (!data) {
                allReports = [];
            } else {
                allReports = Object.entries(data).map(
                    ([id, report]) => ({
                        id,
                        ...report
                    })
                );
            }

            if (loadingMessage) {
                loadingMessage.textContent = `${allReports.length} report(s) loaded`;
            }

            applyFilters();
        },
        (error) => {
            console.error("Firebase error:", error);

            if (loadingMessage) loadingMessage.textContent = "Error loading reports";

            if (reportsContainer) {
                reportsContainer.innerHTML = `
                    <p class="error-message">
                        Unable to load production reports.
                        Please check your internet connection or Firebase settings.
                    </p>
                `;
            }
        }
    );
}


// =====================================================
// FILTER REPORTS
// =====================================================

function applyFilters() {
    const selectedDate = reportDate ? reportDate.value : "";
    const selectedShift = shiftFilter ? shiftFilter.value : "";
    const selectedUnit = unitFilter ? unitFilter.value : "";

    let filteredReports = [...allReports];

    // DATE FILTER
    if (selectedDate) {
        filteredReports = filteredReports.filter(
            report => report.productionDate === selectedDate
        );
    }

    // SHIFT FILTER
    if (selectedShift) {
        filteredReports = filteredReports.filter(
            report => report.shift === selectedShift
        );
    }

    // UNIT FILTER
    if (selectedUnit) {
        filteredReports = filteredReports.filter(
            report => report.unit === selectedUnit
        );
    }

    // SORT REPORTS DESCENDING BY TIMESTAMP
    filteredReports.sort((a, b) => {
        const timeA = Number(a.entryTimestamp || 0);
        const timeB = Number(b.entryTimestamp || 0);
        return timeB - timeA;
    });

    renderReports(filteredReports);
    
    // Update target dashboard bar if date and unit are active
    if (selectedDate && selectedUnit) {
        displayTargets(selectedDate, selectedUnit);
    } else if (targetCard) {
        targetCard.classList.add("hidden");
    }
}


// =====================================================
// RENDER ALL REPORTS
// =====================================================

function renderReports(reports) {
    if (!reportsContainer) return;

    reportsContainer.innerHTML = "";

    let totalMachines = 0;
    let totalProduction = 0;
    let totalIdle = 0;

    if (reports.length === 0) {
        reportsContainer.innerHTML = `
            <p class="empty-message">
                No reports found for the selected filters.
            </p>
        `;

        updateSummary(0, 0, 0, 0);
        return;
    }

    reports.forEach(report => {
        const machines = Array.isArray(report.machines)
            ? report.machines
            : Object.values(report.machines || {});

        totalMachines += machines.length;

        machines.forEach(machine => {
            const status = (machine.status || "").toLowerCase();

            if (status.includes("idle") || status.includes("maintenance")) {
                totalIdle++;
            } else {
                totalProduction++;
            }
        });

        reportsContainer.appendChild(createReportCard(report));
    });

    updateSummary(
        reports.length,
        totalMachines,
        totalProduction,
        totalIdle
    );
}


// =====================================================
// CREATE REPORT CARD
// =====================================================

function createReportCard(report) {
    const card = document.createElement("div");
    card.className = "report-card";

    const machines = Array.isArray(report.machines)
        ? report.machines
        : Object.values(report.machines || {});

    const reportHeader = document.createElement("div");
    reportHeader.className = "report-header";

    reportHeader.innerHTML = `
        <div class="report-title">
            Production Report
        </div>
        <div class="report-info">
            <span>
                <strong>Date:</strong>
                ${formatDate(report.productionDate)}
            </span>
            <span>
                <strong>Shift:</strong>
                ${escapeHTML(report.shift || "-")}
            </span>
            <span>
                <strong>Unit:</strong>
                ${escapeHTML(report.unit || "-")}
            </span>
            <span>
                <strong>Supervisor:</strong>
                ${escapeHTML(report.supervisor || "-")}
            </span>
        </div>
    `;

    card.appendChild(reportHeader);

    // ACTION BUTTONS
    const actionBar = document.createElement("div");
    actionBar.className = "report-action-bar";

    const copyButton = document.createElement("button");
    copyButton.className = "report-action-btn copy-btn";
    copyButton.innerHTML = "📋 Copy Report";

    copyButton.addEventListener("click", async () => {
        const text = generateReportText(report);

        try {
            await navigator.clipboard.writeText(text);
            copyButton.innerHTML = "✅ Copied";
            setTimeout(() => {
                copyButton.innerHTML = "📋 Copy Report";
            }, 2000);
        } catch (error) {
            console.error("Copy failed:", error);
            const textarea = document.createElement("textarea");
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            copyButton.innerHTML = "✅ Copied";
            setTimeout(() => {
                copyButton.innerHTML = "📋 Copy Report";
            }, 2000);
        }
    });

    const printButton = document.createElement("button");
    printButton.className = "report-action-btn print-btn";
    printButton.innerHTML = "🖨️ Print Report";
    printButton.addEventListener("click", () => {
        printReport(report);
    });

    const whatsappButton = document.createElement("button");
    whatsappButton.className = "report-action-btn whatsapp-btn";
    whatsappButton.innerHTML = "🟢 WhatsApp Report";
    whatsappButton.addEventListener("click", () => {
        sendWhatsAppReport(report);
    });

    actionBar.appendChild(copyButton);
    actionBar.appendChild(printButton);
    actionBar.appendChild(whatsappButton);
    card.appendChild(actionBar);

    // PROCESS SECTIONS
    const processGroups = {};

    machines.forEach(machine => {
        const process = machine.process || "Other";
        if (!processGroups[process]) {
            processGroups[process] = [];
        }
        processGroups[process].push(machine);
    });

    const processOrder = [
        "Printing",
        "Lamination",
        "ColdSeal",
        "Cold Seal",
        "Extrusion",
        "Slitting",
        "Doctoring",
        "Inspection",
        "Extrusion Coating"
    ];

    const sortedProcesses = Object.keys(processGroups).sort((a, b) => {
        const indexA = processOrder.indexOf(a);
        const indexB = processOrder.indexOf(b);
        const orderA = indexA === -1 ? 999 : indexA;
        const orderB = indexB === -1 ? 999 : indexB;
        return orderA - orderB;
    });

    sortedProcesses.forEach(process => {
        const section = createProcessSection(process, processGroups[process]);
        card.appendChild(section);
    });

    return card;
}


// =====================================================
// CREATE PROCESS SECTION
// =====================================================

function createProcessSection(process, machines) {
    const section = document.createElement("div");
    section.className = "process-section";

    const title = document.createElement("div");
    title.className = "process-title";
    title.textContent = process;
    section.appendChild(title);

    const wrapper = document.createElement("div");
    wrapper.className = "machine-table-wrapper";

    const table = document.createElement("table");
    table.className = "machine-table";

    // DOCTORING PROCESS TABLE
    if (process === "Doctoring") {
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Machine</th>
                    <th>Status</th>
                    <th>Total Coils</th>
                    <th>Coil Details</th>
                    <th>Remarks</th>
                </tr>
            </thead>
        `;

        const tbody = document.createElement("tbody");

        machines.forEach(machine => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${escapeHTML(machine.machine || "-")}</td>
                <td>${statusBadge(machine.status)}</td>
                <td>${escapeHTML(machine.totalCoils ?? "-")}</td>
                <td><div class="coil-details">${escapeHTML(machine.coilDetails || "-")}</div></td>
                <td><div class="remarks">${escapeHTML(machine.remarks || "-")}</div></td>
            `;
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        wrapper.appendChild(table);
        section.appendChild(wrapper);
        return section;
    }

    // INSPECTION PROCESS TABLE
    if (process === "Inspection") {
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Machine</th>
                    <th>Status</th>
                    <th>Weight (kg)</th>
                    <th>Job Name</th>
                    <th>Remarks</th>
                </tr>
            </thead>
        `;

        const tbody = document.createElement("tbody");

        machines.forEach(machine => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${escapeHTML(machine.machine || "-")}</td>
                <td>${statusBadge(machine.status)}</td>
                <td>${escapeHTML(machine.weight ?? "-")}</td>
                <td>${escapeHTML(machine.jobName || "-")}</td>
                <td><div class="remarks">${escapeHTML(machine.remarks || "-")}</div></td>
            `;
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        wrapper.appendChild(table);
        section.appendChild(wrapper);
        return section;
    }

    // STANDARD PROCESS TABLE
    let lengthHeading = "Length (m)";
    if (process === "Printing") lengthHeading = "Printed Length (m)";
    if (process === "Lamination") lengthHeading = "Laminated Length (m)";
    if (process === "Slitting") lengthHeading = "Slitted Length (m)";
    if (process === "Extrusion Coating") lengthHeading = "Coated Length (m)";
    if (process === "Extrusion") lengthHeading = "Extruded Length (m)";
    if (process === "ColdSeal" || process === "Cold Seal") lengthHeading = "ColdSealed Length (m)";

    table.innerHTML = `
        <thead>
            <tr>
                <th>Machine</th>
                <th>Status</th>
                <th>${lengthHeading}</th>
                <th>Weight (kg)</th>
                <th>Speed</th>
                <th>Product</th>
                <th>Remarks</th>
            </tr>
        </thead>
    `;

    const tbody = document.createElement("tbody");

    machines.forEach(machine => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${escapeHTML(machine.machine || "-")}</td>
            <td>${statusBadge(machine.status)}</td>
            <td>${escapeHTML(machine.length ?? "-")}</td>
            <td>${escapeHTML(machine.weight ?? "-")}</td>
            <td>${escapeHTML(machine.speed ?? "-")}</td>
            <td>${escapeHTML(machine.product || "-")}</td>
            <td><div class="remarks">${escapeHTML(machine.remarks || "-")}</div></td>
        `;
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);
    section.appendChild(wrapper);
    return section;
}


// =====================================================
// GENERATE REPORT TEXT
// =====================================================

function generateReportText(report) {
    const machines = Array.isArray(report.machines)
        ? report.machines
        : Object.values(report.machines || {});

    let text = "";
    text += "🏭 APEX PRODUCTION REPORT\n";
    text += "━━━━━━━━━━━━━━━━━\n";
    text += `📅 Date: ${formatDate(report.productionDate)}\n`;
    text += `🔄 Shift: ${report.shift || "-"}\n`;
    text += `🏢 Unit: ${report.unit || "-"}\n`;
    text += `👤 Supervisor: ${report.supervisor || "-"}\n`;
    text += "━━━━━━━━━━━━━━━━━\n";

    const processGroups = {};

    machines.forEach(machine => {
        const process = machine.process || "Other";
        if (!processGroups[process]) {
            processGroups[process] = [];
        }
        processGroups[process].push(machine);
    });

    const processOrder = [
        "Printing",
        "Lamination",
        "ColdSeal",
        "Cold Seal",
        "Extrusion",
        "Slitting",
        "Doctoring",
        "Inspection",
        "Extrusion Coating"
    ];

    const sortedProcesses = Object.keys(processGroups).sort((a, b) => {
        const indexA = processOrder.indexOf(a);
        const indexB = processOrder.indexOf(b);
        const orderA = indexA === -1 ? 999 : indexA;
        const orderB = indexB === -1 ? 999 : indexB;
        return orderA - orderB;
    });

    sortedProcesses.forEach(process => {
        text += `\n🔹 ${process.toUpperCase()}\n`;
        text += "─────────────────\n";

        processGroups[process].forEach(machine => {
            text += `Machine: ${machine.machine || "-"}\n`;
            text += `Status: ${machine.status || "-"}\n`;

            if (process === "Doctoring") {
                text += `Total Coils: ${machine.totalCoils ?? "-"}\n`;
                text += `Coil Details: ${machine.coilDetails || "-"}\n`;
            } else if (process === "Inspection") {
                text += `Weight: ${machine.weight ?? "-"} kg\n`;
                text += `Job Name: ${machine.jobName || "-"}\n`;
            } else {
                let lengthLabel = "Length";
                if (process === "Printing") lengthLabel = "Printed Length";
                if (process === "Lamination") lengthLabel = "Laminated Length";
                if (process === "Slitting") lengthLabel = "Slitted Length";
                if (process === "Extrusion Coating") lengthLabel = "Coated Length";
                if (process === "Extrusion") lengthLabel = "Extruded Length";
                if (process === "ColdSeal" || process === "Cold Seal") lengthLabel = "ColdSealed Length";

                text += `${lengthLabel}: ${machine.length ?? "-"} m\n`;
                text += `Weight: ${machine.weight ?? "-"} kg\n`;
                text += `Speed: ${machine.speed ?? "-"}\n`;
                text += `Product: ${machine.product || "-"}\n`;
            }

            text += `Remarks: ${machine.remarks || "-"}\n\n`;
        });
    });

    text += "━━━━━━━━━━━━━━━━━\n";
    text += "Generated from Apex Production Report System";

    return text;
}


function sendWhatsAppReport(report) {
    const text = generateReportText(report);
    const whatsappURL = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappURL, "_blank");
}


function printReport(report) {
    const machines = Array.isArray(report.machines)
        ? report.machines
        : Object.values(report.machines || {});

    const printCard = document.createElement("div");
    printCard.className = "report-card";

    const reportHeader = document.createElement("div");
    reportHeader.className = "report-header";

    reportHeader.innerHTML = `
        <div class="report-title">APEX PRODUCTION REPORT</div>
        <div class="report-info">
            <span><strong>Date:</strong> ${formatDate(report.productionDate)}</span>
            <span><strong>Shift:</strong> ${escapeHTML(report.shift || "-")}</span>
            <span><strong>Unit:</strong> ${escapeHTML(report.unit || "-")}</span>
            <span><strong>Supervisor:</strong> ${escapeHTML(report.supervisor || "-")}</span>
        </div>
    `;

    printCard.appendChild(reportHeader);

    const processGroups = {};

    machines.forEach(machine => {
        const process = machine.process || "Other";
        if (!processGroups[process]) {
            processGroups[process] = [];
        }
        processGroups[process].push(machine);
    });

    const processOrder = [
        "Printing",
        "Lamination",
        "ColdSeal",
        "Cold Seal",
        "Extrusion",
        "Slitting",
        "Doctoring",
        "Inspection",
        "Extrusion Coating"
    ];

    const sortedProcesses = Object.keys(processGroups).sort((a, b) => {
        const indexA = processOrder.indexOf(a);
        const indexB = processOrder.indexOf(b);
        const orderA = indexA === -1 ? 999 : indexA;
        const orderB = indexB === -1 ? 999 : indexB;
        return orderA - orderB;
    });

    sortedProcesses.forEach(process => {
        printCard.appendChild(createProcessSection(process, processGroups[process]));
    });

    const printWindow = window.open("", "_blank", "width=1200,height=800");

    if (!printWindow) {
        alert("Please allow pop-ups to print the report.");
        return;
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Apex Production Report - ${formatDate(report.productionDate)}</title>
            <style>
                * { box-sizing: border-box; }
                body { font-family: Arial, sans-serif; margin: 20px; color: #000; }
                .report-card { width: 100%; }
                .report-title { font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 15px; }
                .report-info { display: flex; flex-wrap: wrap; gap: 20px; padding: 12px; border: 1px solid #000; margin-bottom: 15px; }
                .process-section { margin-bottom: 20px; }
                .process-title { font-size: 17px; font-weight: bold; background: #eaeaea; padding: 8px; border: 1px solid #000; }
                .machine-table-wrapper { width: 100%; }
                .machine-table { width: 100%; border-collapse: collapse; }
                .machine-table th, .machine-table td { border: 1px solid #000; padding: 7px; font-size: 12px; text-align: left; vertical-align: top; }
                .machine-table th { background: #f2f2f2; font-weight: bold; }
                .status-badge { font-weight: bold; }
                .status-production { color: #000; }
                .status-idle { color: #000; }
                .status-maintenance { color: #000; }
                .remarks { white-space: pre-wrap; }
                @page { size: A4 landscape; margin: 10mm; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>${printCard.outerHTML}</body>
        </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}


function statusBadge(status) {
    const value = String(status || "Production");
    const lower = value.toLowerCase();

    let className = "status-production";

    if (lower.includes("idle")) className = "status-idle";
    if (lower.includes("maintenance")) className = "status-maintenance";

    return `
        <span class="status-badge ${className}">
            ${escapeHTML(value)}
        </span>
    `;
}


// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function formatDate(dateString) {
    if (!dateString) return "-";
    const parts = dateString.split("-");
    if (parts.length !== 3) return escapeHTML(dateString);
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function escapeHTML(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function updateSummary(reports, machines, production, idle) {
    if (reportCount) reportCount.textContent = reports;
    if (machineCount) machineCount.textContent = machines;
    if (productionCount) productionCount.textContent = production;
    if (idleCount) idleCount.textContent = idle;
}


// =====================================================
// EVENT LISTENERS
// =====================================================

if (reportDate) reportDate.addEventListener("change", applyFilters);
if (shiftFilter) shiftFilter.addEventListener("change", applyFilters);
if (unitFilter) unitFilter.addEventListener("change", applyFilters);

if (showAllReports) {
    showAllReports.addEventListener("click", () => {
        if (reportDate) reportDate.value = "";
        if (shiftFilter) shiftFilter.value = "";
        if (unitFilter) unitFilter.value = "";
        applyFilters();
    });
}

if (clearFilters) {
    clearFilters.addEventListener("click", () => {
        if (reportDate) reportDate.value = "";
        if (shiftFilter) shiftFilter.value = "";
        if (unitFilter) unitFilter.value = "";
        applyFilters();
    });
}

if (refreshReports) {
    refreshReports.addEventListener("click", () => {
        if (loadingMessage) loadingMessage.textContent = "Refreshing...";
        loadReports();
    });
}

// TARGET MODAL EVENTS
if (addTargetBtn) addTargetBtn.addEventListener("click", openTargetModal);
if (closeTargetModal) closeTargetModal.addEventListener("click", closeTargetModalFunc);
if (cancelTargetBtn) cancelTargetBtn.addEventListener("click", closeTargetModalFunc);
if (saveTargetBtn) saveTargetBtn.addEventListener("click", saveTarget);

if (targetUnit) targetUnit.addEventListener("change", populateProcessInputs);

if (targetModal) {
    targetModal.addEventListener("click", (e) => {
        if (e.target === targetModal) {
            closeTargetModalFunc();
        }
    });
}


// =====================================================
// INITIALIZATION
// =====================================================

loadReports();
