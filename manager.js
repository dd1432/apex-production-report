import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getDatabase,
    ref,
    onValue,
    set,
    get,
    child,
    remove
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
const targetsRef = ref(db, "productionTargets");

// Pending WIP uses its own Firebase path.
// It does not use productionReports.
const pendingWIPRef = ref(db, "pendingWIP");

// =====================================================
// HTML ELEMENTS
// =====================================================

const reportFromDate = document.getElementById("reportFromDate");
const reportToDate = document.getElementById("reportToDate");
const shiftFilter = document.getElementById("shiftFilter");
const unitFilter = document.getElementById("unitFilter");
const showAllReports = document.getElementById("showAllReports");
const clearFilters = document.getElementById("clearFilters");
const refreshReports = document.getElementById("refreshReports");
const addTargetBtn = document.getElementById("addTargetBtn");
const reportsContainer = document.getElementById("reportsContainer");
const loadingMessage = document.getElementById("loadingMessage");
const reportsResultInfo = document.getElementById("reportsResultInfo");
const reportCount = document.getElementById("reportCount");
const machineCount = document.getElementById("machineCount");
const productionCount = document.getElementById("productionCount");
const idleCount = document.getElementById("idleCount");

// Pending WIP elements
const pendingWIPContainer = document.getElementById("pendingWIPContainer");
const pendingWIPResultInfo = document.getElementById("pendingWIPResultInfo");

// =====================================================
// TARGET MODAL ELEMENTS
// =====================================================

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
const targetOverallPercent = document.getElementById("targetOverallPercent");
const targetTotalTarget = document.getElementById("targetTotalTarget");
const targetTotalAchieved = document.getElementById("targetTotalAchieved");
const targetTotalRemaining = document.getElementById("targetTotalRemaining");
const targetProgressRing = document.getElementById("targetProgressRing");

// =====================================================
// VARIABLES
// =====================================================

let allReports = [];
let allPendingWIP = [];
let pendingWIPAgeTimer = null;

// =====================================================
// UNIT PROCESSES
// =====================================================

const unitProcesses = {
    "Unit 1": [
        "Printing",
        "Lamination",
        "Extrusion",
        "Slitting"
    ],
    "Unit 2": [
        "Printing",
        "Lamination",
        "ColdSeal",
        "Slitting"
    ]
};

// =====================================================
// PROCESS COLOR MAPPING
// =====================================================

const processColors = {
    "Printing": "printing-bar",
    "Lamination": "lamination-bar",
    "Extrusion": "extrusion-bar",
    "Slitting": "slitting-bar",
    "ColdSeal": "coldseal-bar"
};

// =====================================================
// TAB SYSTEM
// =====================================================

document.querySelectorAll(".dashboard-tab").forEach(button => {
    button.addEventListener("click", () => {
        const targetId = button.dataset.tab;

        document.querySelectorAll(".dashboard-tab").forEach(tab => {
            tab.classList.remove("active");
        });

        document.querySelectorAll(".tab-content").forEach(tab => {
            tab.classList.remove("active");
        });

        button.classList.add("active");

        const target = document.getElementById(targetId);
        if (target) {
            target.classList.add("active");
        }
    });
});

// =====================================================
// TARGET MODAL MANAGEMENT
// =====================================================

function openTargetModal() {
    const today = new Date();
    const dateString = today.toISOString().split("T")[0];

    targetDate.value = dateString;
    targetUnit.value = "";
    targetProcessContainer.innerHTML = "";
    targetModal.classList.remove("hidden");
}

function closeTargetModalFunc() {
    targetModal.classList.add("hidden");
    targetProcessContainer.innerHTML = "";
}

function populateProcessInputs() {
    const selectedUnit = targetUnit.value;

    if (!selectedUnit) {
        targetProcessContainer.innerHTML = "";
        return;
    }

    const processes = unitProcesses[selectedUnit] || [];
    targetProcessContainer.innerHTML = "";

    processes.forEach(process => {
        const group = document.createElement("div");
        group.className = "process-input-group";

        group.innerHTML = `
            <label>${escapeHTML(process)}</label>
            <input
                type="number"
                data-process="${escapeHTML(process)}"
                placeholder="Target (kg)"
                min="0"
                step="0.01">
        `;

        targetProcessContainer.appendChild(group);
    });
}

// =====================================================
// SAVE TARGET
// =====================================================

function saveTarget() {
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

        if (value > 0) {
            targets[process] = value;
            hasTarget = true;
        }
    });

    if (!hasTarget) {
        alert("Please enter at least one target value");
        return;
    }

    const targetKey = `${date}_${unit}`;
    const targetPath = `productionTargets/${targetKey}`;

    set(ref(db, targetPath), {
        date: date,
        unit: unit,
        targets: targets,
        timestamp: Date.now()
    })
    .then(() => {
        alert("Target saved successfully!");
        closeTargetModalFunc();
        displayTargets(date, unit);
    })
    .catch(error => {
        console.error("Error saving target:", error);
        alert("Error saving target");
    });
}

// =====================================================
// DISPLAY TARGETS
// =====================================================

function displayTargets(date, unit) {
    if (!date || !unit) {
        targetCard.classList.add("hidden");
        return;
    }

    targetCard.classList.remove("hidden");
    targetInfo.textContent = `${formatDate(date)} • ${unit}`;

    const targetKey = `${date}_${unit}`;
    const targetPath = `productionTargets/${targetKey}`;

    get(child(ref(db), targetPath))
        .then(snapshot => {
            if (!snapshot.exists()) {
                resetTargetOverview();
                targetContainer.innerHTML = `
                    <p class="empty-message">
                        No targets set for this date and unit.
                    </p>
                `;
                return;
            }

            const targetData = snapshot.val();
            targetContainer.innerHTML = "";

            const filteredReports = allReports.filter(report =>
                report.productionDate === date &&
                report.unit === unit
            );

            const achievements = calculateAchievements(
                filteredReports,
                targetData.targets
            );

            renderTargetOverview(
                targetData.targets,
                achievements
            );

            Object.entries(targetData.targets).forEach(
                ([process, targetValue]) => {
                    const achievement = achievements[process] || 0;
                    const percentage = targetValue > 0
                        ? (achievement / targetValue) * 100
                        : 0;
                    const percentageLabel = Math.round(percentage);
                    const barWidth = Math.min(Math.max(percentage, 0), 100);

                    const item = document.createElement("div");
                    item.className = "target-item";

                    const colorClass = processColors[process] || "printing-bar";
                    const remaining = Math.max(0, targetValue - achievement);

                    item.innerHTML = `
                        <div class="target-process-name">
                            ${escapeHTML(process)}
                        </div>
                        <div class="target-bar-container">
                            <div
                                class="target-bar-fill ${colorClass}"
                                style="width: ${barWidth}%">
                            </div>
                        </div>
                        <div class="target-stats">
                            <span>Actual: ${achievement.toFixed(2)} kg</span>
                            <span>${percentageLabel}%</span>
                            <span>Target: ${targetValue.toFixed(2)} kg</span>
                        </div>
                    `;

                    targetContainer.appendChild(item);
                }
            );
        })
        .catch(error => {
            console.error("Error loading targets:", error);
            resetTargetOverview();
            targetContainer.innerHTML = `
                <p class="empty-message">Error loading targets.</p>
            `;
        });
}

// =====================================================
// TARGET OVERVIEW
// =====================================================

function renderTargetOverview(targets, achievements) {
    let totalTarget = 0;
    let totalAchieved = 0;

    Object.entries(targets).forEach(([process, target]) => {
        totalTarget += parseFloat(target) || 0;
        totalAchieved += parseFloat(achievements[process] || 0);
    });

    const percentage = totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0;
    const displayPercentage = Math.round(percentage);
    const remaining = Math.max(0, totalTarget - totalAchieved);

    targetOverallPercent.textContent = `${displayPercentage}%`;
    targetTotalTarget.textContent = `${totalTarget.toFixed(2)} kg`;
    targetTotalAchieved.textContent = `${totalAchieved.toFixed(2)} kg`;
    targetTotalRemaining.textContent = `${remaining.toFixed(2)} kg`;

    const ringPercentage = Math.min(Math.max(percentage, 0), 100);
    const degree = ringPercentage * 3.6;

    targetProgressRing.style.display = "block";
    targetProgressRing.parentElement.style.background = `
        conic-gradient(#22c55e 0deg ${degree}deg, #e5e7eb ${degree}deg 360deg)
    `;

    if (percentage >= 100) {
        targetOverallPercent.style.color = "#15803d";
    } else if (percentage >= 80) {
        targetOverallPercent.style.color = "#ca8a04";
    } else {
        targetOverallPercent.style.color = "#dc2626";
    }
}

function resetTargetOverview() {
    targetOverallPercent.textContent = "0%";
    targetTotalTarget.textContent = "0 kg";
    targetTotalAchieved.textContent = "0 kg";
    targetTotalRemaining.textContent = "0 kg";
    targetProgressRing.parentElement.style.background = `
        conic-gradient(#e5e7eb 0deg, #e5e7eb 360deg)
    `;
}

// =====================================================
// CALCULATE TARGET ACHIEVEMENT
// =====================================================

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

            if (Object.prototype.hasOwnProperty.call(achievements, process)) {
                const weight = parseFloat(machine.weight) || 0;
                achievements[process] += weight;
            }
        });
    });

    return achievements;
}

// =====================================================
// TARGET EVENT LISTENERS
// =====================================================

addTargetBtn.addEventListener("click", openTargetModal);
closeTargetModal.addEventListener("click", closeTargetModalFunc);
cancelTargetBtn.addEventListener("click", closeTargetModalFunc);
saveTargetBtn.addEventListener("click", saveTarget);
targetUnit.addEventListener("change", populateProcessInputs);

targetModal.addEventListener("click", event => {
    if (event.target === targetModal) {
        closeTargetModalFunc();
    }
});

// =====================================================
// LOAD REPORTS FROM FIREBASE
// =====================================================

function loadReports() {
    loadingMessage.textContent = "Loading...";

    onValue(reportsRef, snapshot => {
        const data = snapshot.val();

        if (!data) {
            allReports = [];
        } else {
            allReports = Object.entries(data).map(([id, report]) => ({
                id,
                ...report
            }));
        }

        loadingMessage.textContent = `${allReports.length} report(s) loaded`;
        applyFilters();
    }, error => {
        console.error("Firebase error:", error);
        loadingMessage.textContent = "Error loading reports";

        reportsContainer.innerHTML = `
            <p class="error-message">
                Unable to load production reports. Check your connection.
            </p>
        `;
    });
}

// =====================================================
// PENDING WIP: LOAD FIREBASE RECORDS
// =====================================================

function loadPendingWIP() {
    if (!pendingWIPContainer || !pendingWIPResultInfo) {
        console.error("Pending WIP HTML elements are missing.");
        return;
    }

    pendingWIPContainer.innerHTML = `
        <p class="empty-message">Loading Pending WIP rolls...</p>
    `;

    onValue(pendingWIPRef, snapshot => {
        const data = snapshot.val();

        if (!data || typeof data !== "object") {
             = [];
        } else {
             = Object.entries(data)
                .filter(([, record]) => {
                    return record !== null &&
                        typeof record === "object";
                })
                .map(([id, record]) => ({
                    id,
                    ...record
                }));
        }

        renderPendingWIP();
    }, error => {
        console.error("Error loading Pending WIP:", error);

        pendingWIPResultInfo.textContent = "Unable to load records";

        pendingWIPContainer.innerHTML = `
            <p class="error-message">
                Unable to load Pending WIP rolls. Check your connection.
            </p>
        `;
    });

    // Refresh the displayed ages at local midnight.
    schedulePendingWIPAgeRefresh();
}

// =====================================================
// PENDING WIP: LOCAL CALENDAR DATE UTILITIES
// =====================================================

// Read today's date using the browser's local calendar.
// Do not use toISOString() for local-date calculations.
function getLocalCalendarDate() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// Convert YYYY-MM-DD to a UTC calendar-day number.
// This avoids timezone and daylight-saving errors when
// calculating differences between calendar dates.
function getCalendarDayNumber(dateString) {
    if (typeof dateString !== "string") {
        return null;
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);

    if (!match) {
        return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const timestamp = Date.UTC(year, month - 1, day);
    const check = new Date(timestamp);

    // Reject impossible calendar dates.
    if (
        check.getUTCFullYear() !== year ||
        check.getUTCMonth() !== month - 1 ||
        check.getUTCDate() !== day
    ) {
        return null;
    }

    return Math.floor(timestamp / 86400000);
}

// Age is based on the entered productionDate, not
// Firebase's timestamp or record creation time.
function calculatePendingWIPAge(productionDate) {
    const productionDay = getCalendarDayNumber(productionDate);
    const todayDay = getCalendarDayNumber(getLocalCalendarDate());

    if (productionDay === null || todayDay === null) {
        return null;
    }

    return todayDay - productionDay;
}

// =====================================================
// PENDING WIP: REFRESH AGES AT LOCAL MIDNIGHT
// =====================================================

function schedulePendingWIPAgeRefresh() {
    if (pendingWIPAgeTimer !== null) {
        clearTimeout(pendingWIPAgeTimer);
    }

    const now = new Date();

    const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0, 0, 1, 0
    );

    const delay = Math.max(1000, nextMidnight.getTime() - now.getTime());

    pendingWIPAgeTimer = setTimeout(() => {
        renderPendingWIP();
        schedulePendingWIPAgeRefresh();
    }, delay);
}

// =====================================================
// PENDING WIP: SAFE CELL CREATION
// =====================================================

function createPendingWIPCell(value) {
    const cell = document.createElement("td");

    cell.textContent =
        value === null || value === undefined || value === ""
            ? "-"
            : String(value);

    return cell;
}

// =====================================================
// PENDING WIP: RENDER TABLE
// =====================================================

function renderPendingWIP() {
    if (!pendingWIPContainer || !pendingWIPResultInfo) {
        return;
    }

    pendingWIPContainer.innerHTML = "";

    const count = allPendingWIP.length;

const totalWeight = allPendingWIP.reduce((sum, record) => {
    const weight = Number(record.weight);
    return sum + (Number.isFinite(weight) ? weight : 0);
}, 0);

const formattedWeight = Number(totalWeight.toFixed(2));

pendingWIPResultInfo.textContent =
    `${count} roll${count === 1 ? "" : "s"} · ${formattedWeight.toLocaleString("en-IN")} kg`;

    if (count === 0) {
        pendingWIPContainer.innerHTML = `
            <p class="empty-message">No Pending WIP rolls found.</p>
        `;
        return;
    }

    // Newest production date first.
    // Records with the same date retain a stable ID-based order.
    const sortedRecords = [...allPendingWIP].sort((a, b) => {
        const dateA = String(a.productionDate || "");
        const dateB = String(b.productionDate || "");

        const dateComparison = dateB.localeCompare(dateA);

        if (dateComparison !== 0) {
            return dateComparison;
        }

        return String(a.id).localeCompare(String(b.id));
    });

    const wrapper = document.createElement("div");
    wrapper.className = "machine-table-wrapper pending-wip-table-wrapper";

    const table = document.createElement("table");
    table.className = "machine-table pending-wip-table";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    const headings = [
        "Sr. No.",
        "Job No.",
        "Job Name",
        "Status",
        "Roll No.",
        "Weight",
        "Production Date",
        "Age (Days)",
        "Remark on Label",
        "Action — Release"
    ];

    headings.forEach(heading => {
        const th = document.createElement("th");
        th.textContent = heading;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    sortedRecords.forEach((record, index) => {
        const row = document.createElement("tr");

        // Support common field-name variants without
        // changing the underlying Firebase record.
        const jobNo = record.jobNo ??
            record.jobNumber ??
            record.job ??
            "";

        const jobName = record.jobName ?? "";

        const status = record.status ?? "";

        const rollNo = record.rollNo ??
            record.rollNumber ??
            "";

        const weight = record.weight ?? "";

        const productionDate = record.productionDate ?? "";

        const remarkOnLabel = record.remarkOnLabel ??
            record.labelRemark ??
            record.remark ??
            "";

        row.appendChild(createPendingWIPCell(index + 1));
        row.appendChild(createPendingWIPCell(jobNo));
        row.appendChild(createPendingWIPCell(jobName));
        row.appendChild(createPendingWIPCell(status));
        row.appendChild(createPendingWIPCell(rollNo));
        row.appendChild(createPendingWIPCell(weight));
        row.appendChild(createPendingWIPCell(formatDate(productionDate)));

        const age = calculatePendingWIPAge(productionDate);

        row.appendChild(
            createPendingWIPCell(age === null ? "-" : age)
        );

        row.appendChild(createPendingWIPCell(remarkOnLabel));

        const actionCell = document.createElement("td");
        actionCell.className = "pending-wip-action-cell";

        const releaseButton = document.createElement("button");
        releaseButton.type = "button";
        releaseButton.className = "pending-wip-release-button";
        releaseButton.textContent = "Release";
        releaseButton.setAttribute(
            "aria-label",
            `Release roll ${String(rollNo || record.id)}`
        );

        releaseButton.addEventListener("click", () => {
            releasePendingWIP(record.id, releaseButton);
        });

        actionCell.appendChild(releaseButton);
        row.appendChild(actionCell);

        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);
    pendingWIPContainer.appendChild(wrapper);
}

// =====================================================
// PENDING WIP: RELEASE ONE SPECIFIC ROLL
// =====================================================

async function releasePendingWIP(recordId, button) {
    if (!recordId) {
        alert("Unable to identify this Pending WIP record.");
        return;
    }

    // Ask for the releasing person's name.
    const releasingPerson = prompt(
        "Enter the name of the person releasing this roll:"
    );

    // Cancelled, empty or whitespace-only input:
    // do not release the record.
    if (releasingPerson === null || !releasingPerson.trim()) {
        return;
    }

    const confirmed = confirm(
        "Release this Pending WIP roll?"
    );

    if (!confirmed) {
        return;
    }

    if (button) {
        button.disabled = true;
        button.textContent = "Releasing...";
    }

    try {
        // Delete only this record's Firebase child.
        // Do not remove the entire pendingWIP path.
        await remove(ref(db, `pendingWIP/${recordId}`));

        // The Firebase listener will update the table.
        // The person's name is intentionally not stored.
    } catch (error) {
        console.error("Error releasing Pending WIP roll:", error);

        alert(
            "Unable to release this roll. Please check your connection and try again."
        );

        if (button) {
            button.disabled = false;
            button.textContent = "Release";
        }
    }
}

// =====================================================
// FILTER REPORTS
// =====================================================

function applyFilters() {
    const fromDate = reportFromDate ? reportFromDate.value : "";
    const toDate = reportToDate ? reportToDate.value : "";
    const selectedShift = shiftFilter.value;
    const selectedUnit = unitFilter.value;

    let filteredReports = [...allReports];

    if (fromDate) {
        filteredReports = filteredReports.filter(
            report => report.productionDate >= fromDate
        );
    }

    if (toDate) {
        filteredReports = filteredReports.filter(
            report => report.productionDate <= toDate
        );
    }

    if (selectedShift) {
        filteredReports = filteredReports.filter(
            report => report.shift === selectedShift
        );
    }

    if (selectedUnit) {
        filteredReports = filteredReports.filter(
            report => report.unit === selectedUnit
        );
    }

    filteredReports.sort((a, b) => {
        const timeA = Number(a.entryTimestamp || 0);
        const timeB = Number(b.entryTimestamp || 0);
        return timeB - timeA;
    });

    renderReports(filteredReports);

    if (fromDate && toDate && fromDate === toDate && selectedUnit) {
        displayTargets(fromDate, selectedUnit);
    } else {
        targetCard.classList.add("hidden");
    }
}

// =====================================================
// RENDER REPORTS
// =====================================================

function renderReports(reports) {
    reportsContainer.innerHTML = "";

    let totalMachines = 0;
    let totalProduction = 0;
    let totalIdle = 0;

    if (reports.length === 0) {
        reportsContainer.innerHTML = `
            <p class="empty-message">No reports found for the selected filters.</p>
        `;

        updateSummary(0, 0, 0, 0);
        updateReportsInfo(0);
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

    updateReportsInfo(reports.length);
}

function updateReportsInfo(count) {
    reportsResultInfo.textContent =
        `${count} report${count === 1 ? "" : "s"}`;
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
        <div class="report-title">Production Report</div>
        <div class="report-info">
            <span><strong>Date:</strong> ${formatDate(report.productionDate)}</span>
            <span><strong>Shift:</strong> ${escapeHTML(report.shift || "-")}</span>
            <span><strong>Unit:</strong> ${escapeHTML(report.unit || "-")}</span>
            <span><strong>Supervisor:</strong> ${escapeHTML(report.supervisor || "-")}</span>
        </div>
    `;

    card.appendChild(reportHeader);

    // ACTION BAR
    const actionBar = document.createElement("div");
    actionBar.className = "report-action-bar";

    const copyButton = document.createElement("button");
    copyButton.className = "report-action-btn copy-btn";
    copyButton.title = "Copy Report";
    copyButton.setAttribute("aria-label", "Copy Report");

    copyButton.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path>
        </svg>
    `;

    copyButton.addEventListener("click", async () => {
        const text = generateReportText(report);

        try {
            await navigator.clipboard.writeText(text);
            showActionSuccess(copyButton, "Copied");
        } catch (error) {
            console.error("Copy failed:", error);
            showActionSuccess(copyButton, "Copied");
        }
    });

    const printButton = document.createElement("button");
    printButton.className = "report-action-btn print-btn";
    printButton.title = "Print Report";
    printButton.setAttribute("aria-label", "Print Report");

    printButton.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 8H5c-1.66 0-3 1.34-3 3v4h4v4h12v-4h4v-4c0-1.66-1.34-3-3-3zm-3 9H8v-5h8v5zm3-5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-2-9H6v4h12V3z"></path>
        </svg>
    `;

    printButton.addEventListener("click", () => printReport(report));

    const whatsappButton = document.createElement("button");
    whatsappButton.className = "report-action-btn whatsapp-btn";
    whatsappButton.title = "Share on WhatsApp";
    whatsappButton.setAttribute("aria-label", "Share on WhatsApp");

    whatsappButton.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.15 1.6 5.97L.05 24l6.28-1.65a11.9 11.9 0 0 0 5.73 1.46h.01c6.56 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.17-3.45-8.43z"></path>
        </svg>
    `;

    whatsappButton.addEventListener(
        "click",
        () => sendWhatsAppReport(report)
    );

    actionBar.appendChild(copyButton);
    actionBar.appendChild(printButton);
    actionBar.appendChild(whatsappButton);

    card.appendChild(actionBar);

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
        "Extrusion",
        "Slitting",
        "Doctoring",
        "Inspection",
        "Extrusion Coating"
    ];

    const sortedProcesses = Object.keys(processGroups).sort((a, b) => {
        const indexA = processOrder.indexOf(a);
        const indexB = processOrder.indexOf(b);

        return (indexA === -1 ? 999 : indexA) -
            (indexB === -1 ? 999 : indexB);
    });

    sortedProcesses.forEach(process => {
        const section = createProcessSection(
            process,
            processGroups[process]
        );

        card.appendChild(section);
    });

    return card;
}

function showActionSuccess(button, text) {
    const originalHTML = button.innerHTML;
    const originalTitle = button.title;

    button.classList.add("action-success");

    button.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path>
        </svg>
    `;

    button.title = text;

    setTimeout(() => {
        button.innerHTML = originalHTML;
        button.title = originalTitle;
        button.classList.remove("action-success");
    }, 1800);
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

    // SLITTING
    if (process === "Slitting") {
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Machine</th>
                    <th>Status</th>
                    <th>Slitted Length (m)</th>
                    <th>Weight (kg)</th>
                    <th>Speed</th>
                    <th>Reels (Nos)</th>
                    <th>Hold Reels (Nos)</th>
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
                <td>${escapeHTML(machine.reels ?? "-")}</td>
                <td>${escapeHTML(machine.hold_reels ?? "-")}</td>
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

    // STANDARD PROCESSES
    let lengthHeading = "Length (m)";

    if (process === "Printing") {
        lengthHeading = "Printed Length (m)";
    }

    if (process === "Lamination") {
        lengthHeading = "Laminated Length (m)";
    }

    if (process === "Extrusion Coating") {
        lengthHeading = "Coated Length (m)";
    }

    if (process === "Extrusion") {
        lengthHeading = "Extruded Length (m)";
    }

    if (process === "ColdSeal") {
        lengthHeading = "ColdSealed Length (m)";
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
        "Extrusion",
        "Slitting",
        "Doctoring",
        "Inspection",
        "Extrusion Coating"
    ];

    const sortedProcesses = Object.keys(processGroups).sort((a, b) => {
        const indexA = processOrder.indexOf(a);
        const indexB = processOrder.indexOf(b);

        return (indexA === -1 ? 999 : indexA) -
            (indexB === -1 ? 999 : indexB);
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
            } else if (process === "Slitting") {
                text += `Slitted Length: ${machine.length ?? "-"} m\n`;
                text += `Weight: ${machine.weight ?? "-"} kg\n`;
                text += `Speed: ${machine.speed ?? "-"}\n`;
                text += `Reels: ${machine.reels ?? "-"} Nos\n`;
                text += `Hold Reels: ${machine.hold_reels ?? "-"} Nos\n`;
                text += `Product: ${machine.product || "-"}\n`;
            } else {
                let lengthLabel = "Length";

                if (process === "Printing") {
                    lengthLabel = "Printed Length";
                }

                if (process === "Lamination") {
                    lengthLabel = "Laminated Length";
                }

                if (process === "Extrusion Coating") {
                    lengthLabel = "Coated Length";
                }

                if (process === "Extrusion") {
                    lengthLabel = "Extruded Length";
                }

                if (process === "ColdSeal") {
                    lengthLabel = "ColdSealed Length";
                }

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

// =====================================================
// WHATSAPP REPORT
// =====================================================

function sendWhatsAppReport(report) {
    const text = generateReportText(report);
    const whatsappURL = `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(whatsappURL, "_blank");
}

// =====================================================
// PRINT REPORT
// =====================================================

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
        "Extrusion",
        "Slitting",
        "Doctoring",
        "Inspection",
        "Extrusion Coating"
    ];

    const sortedProcesses = Object.keys(processGroups).sort((a, b) => {
        const indexA = processOrder.indexOf(a);
        const indexB = processOrder.indexOf(b);

        return (indexA === -1 ? 999 : indexA) -
            (indexB === -1 ? 999 : indexB);
    });

    sortedProcesses.forEach(process => {
        printCard.appendChild(
            createProcessSection(process, processGroups[process])
        );
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
                .status-production, .status-idle, .status-maintenance { color: #000; }
                .remarks { white-space: pre-wrap; }
                @page { size: A4 landscape; margin: 10mm; }
                @media print { body { margin: 0; } }
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
    const value = String(status || "Production");
    const lower = value.toLowerCase();

    let className = "status-production";

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

    const parts = String(dateString).split("-");

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

function updateSummary(reports, machines, production, idle) {
    reportCount.textContent = reports;
    machineCount.textContent = machines;
    productionCount.textContent = production;
    idleCount.textContent = idle;
}

// =====================================================
// FILTER EVENTS
// =====================================================

if (reportFromDate) {
    reportFromDate.addEventListener("change", applyFilters);
}

if (reportToDate) {
    reportToDate.addEventListener("change", applyFilters);
}

shiftFilter.addEventListener("change", applyFilters);
unitFilter.addEventListener("change", applyFilters);

showAllReports.addEventListener("click", () => {
    if (reportFromDate) {
        reportFromDate.value = "";
    }

    if (reportToDate) {
        reportToDate.value = "";
    }

    shiftFilter.value = "";
    unitFilter.value = "";

    applyFilters();
});

clearFilters.addEventListener("click", () => {
    if (reportFromDate) {
        reportFromDate.value = "";
    }

    if (reportToDate) {
        reportToDate.value = "";
    }

    shiftFilter.value = "";
    unitFilter.value = "";

    applyFilters();
});

refreshReports.addEventListener("click", () => {
    loadingMessage.textContent = "Refreshing...";
    loadReports();
});

// =====================================================
// START
// =====================================================

loadReports();
loadPendingWIP();

