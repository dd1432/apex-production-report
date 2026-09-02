import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getDatabase,
    ref,
    onValue
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

const reportsContainer = document.getElementById("reportsContainer");
const loadingMessage = document.getElementById("loadingMessage");

const reportCount = document.getElementById("reportCount");
const machineCount = document.getElementById("machineCount");
const productionCount = document.getElementById("productionCount");
const idleCount = document.getElementById("idleCount");


// =====================================================
// VARIABLES
// =====================================================

let allReports = [];


// =====================================================
// LOAD REPORTS FROM FIREBASE
// =====================================================

function loadReports() {

    loadingMessage.textContent = "Loading...";

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

            loadingMessage.textContent =
                `${allReports.length} report(s) loaded`;

            applyFilters();
        },

        (error) => {

            console.error("Firebase error:", error);

            loadingMessage.textContent = "Error loading reports";

            reportsContainer.innerHTML = `
                <p class="error-message">
                    Unable to load production reports.
                    Please check your internet connection or Firebase settings.
                </p>
            `;
        }
    );
}


// =====================================================
// FILTER REPORTS
// =====================================================

function applyFilters() {

    const selectedDate = reportDate.value;
    const selectedShift = shiftFilter.value;
    const selectedUnit = unitFilter.value;

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

    // SORT REPORTS
 filteredReports.sort((a, b) => {

    // Newest submitted report first
    const timeA = Number(a.entryTimestamp || 0);
    const timeB = Number(b.entryTimestamp || 0);

    return timeB - timeA;
});

    renderReports(filteredReports);
}


// =====================================================
// RENDER ALL REPORTS
// =====================================================

function renderReports(reports) {

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

        updateSummary(
            0,
            0,
            0,
            0
        );

        return;
    }


    reports.forEach(report => {

        const machines = Array.isArray(report.machines)
            ? report.machines
            : Object.values(report.machines || {});


        totalMachines += machines.length;


        machines.forEach(machine => {

            const status =
                (machine.status || "").toLowerCase();

            if (
                status.includes("idle") ||
                status.includes("maintenance")
            ) {

                totalIdle++;

            } else {

                totalProduction++;
            }
        });


        reportsContainer.appendChild(
            createReportCard(report)
        );
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


    // =================================================
    // REPORT ACTION BUTTONS
    // =================================================

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

            // Fallback for older browsers
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

    whatsappButton.className =
        "report-action-btn whatsapp-btn";

    whatsappButton.innerHTML =
        "🟢 WhatsApp Report";


    whatsappButton.addEventListener("click", () => {

        sendWhatsAppReport(report);
    });


    actionBar.appendChild(copyButton);

    actionBar.appendChild(printButton);

    actionBar.appendChild(whatsappButton);


    card.appendChild(actionBar);


    // =================================================
    // GROUP MACHINES BY PROCESS
    // =================================================

    const processGroups = {};


    machines.forEach(machine => {

        const process =
            machine.process || "Other";

        if (!processGroups[process]) {
            processGroups[process] = [];
        }

        processGroups[process].push(machine);
    });


    // =================================================
    // PROCESS ORDER
    // =================================================

    const processOrder = [
        "Printing",
        "Lamination",
        "Slitting",
        "Doctoring",
        "Inspection",
        "Extrusion Coating"
    ];


    const sortedProcesses = Object.keys(processGroups).sort(
        (a, b) => {

            const indexA = processOrder.indexOf(a);
            const indexB = processOrder.indexOf(b);

            const orderA =
                indexA === -1 ? 999 : indexA;

            const orderB =
                indexB === -1 ? 999 : indexB;

            return orderA - orderB;
        }
    );


    sortedProcesses.forEach(process => {

        const section =
            createProcessSection(
                process,
                processGroups[process]
            );

        card.appendChild(section);
    });


    return card;
}

// =====================================================
// CREATE PROCESS SECTION
// =====================================================

function createProcessSection(process, machines) {

    const section =
        document.createElement("div");

    section.className = "process-section";


    const title =
        document.createElement("div");

    title.className = "process-title";

    title.textContent = process;


    section.appendChild(title);


    const wrapper =
        document.createElement("div");

    wrapper.className =
        "machine-table-wrapper";


    const table =
        document.createElement("table");

    table.className =
        "machine-table";


    // DOCTORING

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


        const tbody =
            document.createElement("tbody");


        machines.forEach(machine => {

            const row =
                document.createElement("tr");


            row.innerHTML = `
                <td>
                    ${escapeHTML(machine.machine || "-")}
                </td>

                <td>
                    ${statusBadge(machine.status)}
                </td>

                <td>
                    ${escapeHTML(
                        machine.totalCoils ?? "-"
                    )}
                </td>

                <td>
                    <div class="coil-details">
                        ${escapeHTML(
                            machine.coilDetails || "-"
                        )}
                    </div>
                </td>

                <td>
                    <div class="remarks">
                        ${escapeHTML(
                            machine.remarks || "-"
                        )}
                    </div>
                </td>
            `;


            tbody.appendChild(row);
        });


        table.appendChild(tbody);

        wrapper.appendChild(table);

        section.appendChild(wrapper);

        return section;
    }


    // INSPECTION

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


        const tbody =
            document.createElement("tbody");


        machines.forEach(machine => {

            const row =
                document.createElement("tr");


            row.innerHTML = `
                <td>
                    ${escapeHTML(machine.machine || "-")}
                </td>

                <td>
                    ${statusBadge(machine.status)}
                </td>

                <td>
                    ${escapeHTML(
                        machine.weight ?? "-"
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        machine.jobName || "-"
                    )}
                </td>

                <td>
                    <div class="remarks">
                        ${escapeHTML(
                            machine.remarks || "-"
                        )}
                    </div>
                </td>
            `;


            tbody.appendChild(row);
        });


        table.appendChild(tbody);

        wrapper.appendChild(table);

        section.appendChild(wrapper);

        return section;
    }


    // PRINTING / LAMINATION / SLITTING /
    // EXTRUSION COATING

    let lengthHeading = "Length (m)";


    if (process === "Printing") {
        lengthHeading = "Printed Length (m)";
    }

    if (process === "Lamination") {
        lengthHeading = "Laminated Length (m)";
    }

    if (process === "Slitting") {
        lengthHeading = "Slitted Length (m)";
    }

    if (process === "Extrusion Coating") {
        lengthHeading = "Coated Length (m)";
    }


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


    const tbody =
        document.createElement("tbody");


    machines.forEach(machine => {

        const row =
            document.createElement("tr");


        row.innerHTML = `
            <td>
                ${escapeHTML(machine.machine || "-")}
            </td>

            <td>
                ${statusBadge(machine.status)}
            </td>

            <td>
                ${escapeHTML(machine.length ?? "-")}
            </td>

            <td>
                ${escapeHTML(machine.weight ?? "-")}
            </td>

            <td>
                ${escapeHTML(machine.speed ?? "-")}
            </td>

            <td>
                ${escapeHTML(machine.product || "-")}
            </td>

            <td>
                <div class="remarks">
                    ${escapeHTML(machine.remarks || "-")}
                </div>
            </td>
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


    // GROUP BY PROCESS

    const processGroups = {};


    machines.forEach(machine => {

        const process =
            machine.process || "Other";

        if (!processGroups[process]) {
            processGroups[process] = [];
        }

        processGroups[process].push(machine);
    });


    const processOrder = [
        "Printing",
        "Lamination",
        "Slitting",
        "Doctoring",
        "Inspection",
        "Extrusion Coating"
    ];


    const sortedProcesses =
        Object.keys(processGroups).sort(
            (a, b) => {

                const indexA =
                    processOrder.indexOf(a);

                const indexB =
                    processOrder.indexOf(b);

                const orderA =
                    indexA === -1 ? 999 : indexA;

                const orderB =
                    indexB === -1 ? 999 : indexB;

                return orderA - orderB;
            }
        );


    sortedProcesses.forEach(process => {

        text += `\n🔹 ${process.toUpperCase()}\n`;

        text += "─────────────────\n";


        processGroups[process].forEach(machine => {

            text += `Machine: ${machine.machine || "-"}\n`;

            text += `Status: ${machine.status || "-"}\n`;


            if (process === "Doctoring") {

                text += `Total Coils: ${machine.totalCoils ?? "-"}\n`;

                text += `Coil Details: ${machine.coilDetails || "-"}\n`;

            }

            else if (process === "Inspection") {

                text += `Weight: ${machine.weight ?? "-"} kg\n`;

                text += `Job Name: ${machine.jobName || "-"}\n`;

            }

            else {

                let lengthLabel = "Length";

                if (process === "Printing") {
                    lengthLabel = "Printed Length";
                }

                if (process === "Lamination") {
                    lengthLabel = "Laminated Length";
                }

                if (process === "Slitting") {
                    lengthLabel = "Slitted Length";
                }

                if (process === "Extrusion Coating") {
                    lengthLabel = "Coated Length";
                }


                text += `${lengthLabel}: ${machine.length ?? "-"} m\n`;

                text += `Weight: ${machine.weight ?? "-"} kg\n`;

                text += `Speed: ${machine.speed ?? "-"}\n`;

                text += `Product: ${machine.product || "-"}\n`;
            }


            text += `Remarks: ${machine.remarks || "-"}\n`;

            text += "\n";
        });
    });


    text += "━━━━━━━━━━━━━━━━━\n";
    text += "Generated from Apex Production Report System";


    return text;
}


// =====================================================
// WHATSAPP REPORT
// =====================================================

function sendWhatsAppReport(report) {

    const text =
        generateReportText(report);


    const whatsappURL =
        `https://wa.me/?text=${encodeURIComponent(text)}`;


    window.open(
        whatsappURL,
        "_blank"
    );
}


// =====================================================
// PRINT REPORT
// =====================================================

function printReport(report) {

    const machines = Array.isArray(report.machines)
        ? report.machines
        : Object.values(report.machines || {});


    // Create temporary report card
    const printCard = document.createElement("div");

    printCard.className = "report-card";


    const reportHeader =
        document.createElement("div");

    reportHeader.className =
        "report-header";


    reportHeader.innerHTML = `
        <div class="report-title">
            APEX PRODUCTION REPORT
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


    printCard.appendChild(reportHeader);


    // GROUP MACHINES

    const processGroups = {};


    machines.forEach(machine => {

        const process =
            machine.process || "Other";

        if (!processGroups[process]) {
            processGroups[process] = [];
        }

        processGroups[process].push(machine);
    });


    const processOrder = [
        "Printing",
        "Lamination",
        "Slitting",
        "Doctoring",
        "Inspection",
        "Extrusion Coating"
    ];


    const sortedProcesses =
        Object.keys(processGroups).sort(
            (a, b) => {

                const indexA =
                    processOrder.indexOf(a);

                const indexB =
                    processOrder.indexOf(b);

                const orderA =
                    indexA === -1 ? 999 : indexA;

                const orderB =
                    indexB === -1 ? 999 : indexB;

                return orderA - orderB;
            }
        );


    sortedProcesses.forEach(process => {

        printCard.appendChild(
            createProcessSection(
                process,
                processGroups[process]
            )
        );
    });


    // Open print window

    const printWindow =
        window.open(
            "",
            "_blank",
            "width=1200,height=800"
        );


    if (!printWindow) {

        alert(
            "Please allow pop-ups to print the report."
        );

        return;
    }


    printWindow.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <title>
                Apex Production Report -
                ${formatDate(report.productionDate)}
            </title>

            <style>

                * {
                    box-sizing: border-box;
                }

                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    color: #000;
                }

                .report-card {
                    width: 100%;
                }

                .report-title {
                    font-size: 24px;
                    font-weight: bold;
                    text-align: center;
                    margin-bottom: 15px;
                }

                .report-info {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 20px;
                    padding: 12px;
                    border: 1px solid #000;
                    margin-bottom: 15px;
                }

                .process-section {
                    margin-bottom: 20px;
                }

                .process-title {
                    font-size: 17px;
                    font-weight: bold;
                    background: #eaeaea;
                    padding: 8px;
                    border: 1px solid #000;
                }

                .machine-table-wrapper {
                    width: 100%;
                }

                .machine-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .machine-table th,
                .machine-table td {
                    border: 1px solid #000;
                    padding: 7px;
                    font-size: 12px;
                    text-align: left;
                    vertical-align: top;
                }

                .machine-table th {
                    background: #f2f2f2;
                    font-weight: bold;
                }

                .status-badge {
                    font-weight: bold;
                }

                .status-production {
                    color: #000;
                }

                .status-idle {
                    color: #000;
                }

                .status-maintenance {
                    color: #000;
                }

                .remarks {
                    white-space: pre-wrap;
                }

                @page {
                    size: A4 landscape;
                    margin: 10mm;
                }

                @media print {

                    body {
                        margin: 0;
                    }

                }

            </style>

        </head>

        <body>

            ${printCard.outerHTML}

        </body>

        </html>

    `);


    printWindow.document.close();


    printWindow.focus();


    setTimeout(() => {

        printWindow.print();

        printWindow.close();

    }, 500);
}
// =====================================================
// STATUS BADGE
// =====================================================

function statusBadge(status) {

    const value =
        String(status || "Production");


    const lower =
        value.toLowerCase();


    let className =
        "status-production";


    if (lower.includes("idle")) {
        className = "status-idle";
    }

    if (lower.includes("maintenance")) {
        className = "status-maintenance";
    }


    return `
        <span class="status-badge ${className}">
            ${escapeHTML(value)}
        </span>
    `;
}


// =====================================================
// DATE FORMAT
// =====================================================

function formatDate(dateString) {

    if (!dateString) {
        return "-";
    }


    const parts =
        dateString.split("-");


    if (parts.length !== 3) {
        return escapeHTML(dateString);
    }


    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}


// =====================================================
// HTML SAFETY
// =====================================================

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =====================================================
// SUMMARY
// =====================================================

function updateSummary(
    reports,
    machines,
    production,
    idle
) {

    reportCount.textContent = reports;
    machineCount.textContent = machines;
    productionCount.textContent = production;
    idleCount.textContent = idle;
}


// =====================================================
// FILTER EVENTS
// =====================================================

reportDate.addEventListener(
    "change",
    applyFilters
);

shiftFilter.addEventListener(
    "change",
    applyFilters
);

unitFilter.addEventListener(
    "change",
    applyFilters
);


// =====================================================
// SHOW ALL
// =====================================================

showAllReports.addEventListener(
    "click",
    () => {

        reportDate.value = "";
        shiftFilter.value = "";
        unitFilter.value = "";

        applyFilters();
    }
);


// =====================================================
// CLEAR FILTERS
// =====================================================

clearFilters.addEventListener(
    "click",
    () => {

        reportDate.value = "";
        shiftFilter.value = "";
        unitFilter.value = "";

        applyFilters();
    }
);


// =====================================================
// REFRESH
// =====================================================

refreshReports.addEventListener(
    "click",
    () => {

        loadingMessage.textContent =
            "Refreshing...";

        loadReports();
    }
);


// =====================================================
// START
// =====================================================

loadReports();
