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

        const dateA = a.productionDate || "";
        const dateB = b.productionDate || "";

        if (dateA !== dateB) {
            return dateB.localeCompare(dateA);
        }

        const shiftOrder = {
            "1st": 1,
            "2nd": 2,
            "3rd": 3
        };

        return (
            (shiftOrder[a.shift] || 99) -
            (shiftOrder[b.shift] || 99)
        );
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


    // GROUP MACHINES BY PROCESS

    const processGroups = {};


    machines.forEach(machine => {

        const process =
            machine.process || "Other";

        if (!processGroups[process]) {
            processGroups[process] = [];
        }

        processGroups[process].push(machine);
    });


    // PROCESS ORDER

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
