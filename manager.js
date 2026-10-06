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
const targetsRef = ref(db, "productionTargets");


// =====================================================
// HTML ELEMENTS
// =====================================================

const reportFromDate =
    document.getElementById("reportFromDate");

const reportToDate =
    document.getElementById("reportToDate");

const shiftFilter =
    document.getElementById("shiftFilter");

const unitFilter =
    document.getElementById("unitFilter");

const showAllReports =
    document.getElementById("showAllReports");

const clearFilters =
    document.getElementById("clearFilters");

const refreshReports =
    document.getElementById("refreshReports");

const addTargetBtn =
    document.getElementById("addTargetBtn");

const reportsContainer =
    document.getElementById("reportsContainer");

const loadingMessage =
    document.getElementById("loadingMessage");

const reportsResultInfo =
    document.getElementById("reportsResultInfo");

const reportCount =
    document.getElementById("reportCount");

const machineCount =
    document.getElementById("machineCount");

const productionCount =
    document.getElementById("productionCount");

const idleCount =
    document.getElementById("idleCount");


// =====================================================
// TARGET MODAL ELEMENTS
// =====================================================

const targetModal =
    document.getElementById("targetModal");

const closeTargetModal =
    document.getElementById("closeTargetModal");

const saveTargetBtn =
    document.getElementById("saveTargetBtn");

const cancelTargetBtn =
    document.getElementById("cancelTargetBtn");

const targetDate =
    document.getElementById("targetDate");

const targetUnit =
    document.getElementById("targetUnit");

const targetProcessContainer =
    document.getElementById("targetProcessContainer");

const targetContainer =
    document.getElementById("targetContainer");

const targetCard =
    document.querySelector(".target-card");

const targetInfo =
    document.getElementById("targetInfo");

const targetOverallPercent =
    document.getElementById("targetOverallPercent");

const targetTotalTarget =
    document.getElementById("targetTotalTarget");

const targetTotalAchieved =
    document.getElementById("targetTotalAchieved");

const targetTotalRemaining =
    document.getElementById("targetTotalRemaining");

const targetProgressRing =
    document.getElementById("targetProgressRing");


// =====================================================
// VARIABLES
// =====================================================

let allReports = [];


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

    "Printing":
        "printing-bar",

    "Lamination":
        "lamination-bar",

    "Extrusion":
        "extrusion-bar",

    "Slitting":
        "slitting-bar",

    "ColdSeal":
        "coldseal-bar"

};


// =====================================================
// TAB SYSTEM
// =====================================================

document
    .querySelectorAll(".dashboard-tab")
    .forEach(button => {

        button.addEventListener("click", () => {

            const targetId =
                button.dataset.tab;

            document
                .querySelectorAll(".dashboard-tab")
                .forEach(tab => {
                    tab.classList.remove("active");
                });

            document
                .querySelectorAll(".tab-content")
                .forEach(tab => {
                    tab.classList.remove("active");
                });

            button.classList.add("active");

            const target =
                document.getElementById(targetId);

            if (target) {
                target.classList.add("active");
            }

        });

    });


// =====================================================
// TARGET MODAL MANAGEMENT
// =====================================================

function openTargetModal() {

    const today =
        new Date();

    const dateString =
        today.toISOString().split("T")[0];

    targetDate.value =
        dateString;

    targetUnit.value =
        "";

    targetProcessContainer.innerHTML =
        "";

    targetModal.classList.remove(
        "hidden"
    );
}


function closeTargetModalFunc() {

    targetModal.classList.add(
        "hidden"
    );

    targetProcessContainer.innerHTML =
        "";
}


function populateProcessInputs() {

    const selectedUnit =
        targetUnit.value;

    if (!selectedUnit) {

        targetProcessContainer.innerHTML =
            "";

        return;
    }

    const processes =
        unitProcesses[selectedUnit] || [];

    targetProcessContainer.innerHTML =
        "";

    processes.forEach(process => {

        const group =
            document.createElement("div");

        group.className =
            "process-input-group";

        group.innerHTML = `
            <label>${escapeHTML(process)}</label>

            <input
                type="number"
                data-process="${escapeHTML(process)}"
                placeholder="Target (kg)"
                min="0"
                step="0.01">
        `;

        targetProcessContainer
            .appendChild(group);

    });
}


// =====================================================
// SAVE TARGET
// =====================================================

function saveTarget() {

    const date =
        targetDate.value;

    const unit =
        targetUnit.value;

    if (!date || !unit) {

        alert(
            "Please select both date and unit"
        );

        return;
    }

    const targets = {};

    let hasTarget = false;

    targetProcessContainer
        .querySelectorAll("input")
        .forEach(input => {

            const process =
                input.dataset.process;

            const value =
                parseFloat(input.value);

            if (value > 0) {

                targets[process] =
                    value;

                hasTarget =
                    true;
            }

        });

    if (!hasTarget) {

        alert(
            "Please enter at least one target value"
        );

        return;
    }

    const targetKey =
        `${date}_${unit}`;

    const targetPath =
        `productionTargets/${targetKey}`;

    set(
        ref(db, targetPath),
        {
            date: date,
            unit: unit,
            targets: targets,
            timestamp: Date.now()
        }
    )
        .then(() => {

            alert(
                "Target saved successfully!"
            );

            closeTargetModalFunc();

            displayTargets(
                date,
                unit
            );

        })
        .catch(error => {

            console.error(
                "Error saving target:",
                error
            );

            alert(
                "Error saving target"
            );

        });
}


// =====================================================
// DISPLAY TARGETS
// =====================================================

function displayTargets(
    date,
    unit
) {

    if (!date || !unit) {

        targetCard.classList.add(
            "hidden"
        );

        return;
    }

    targetCard.classList.remove(
        "hidden"
    );

    targetInfo.textContent =
        `${formatDate(date)} • ${unit}`;

    const targetKey =
        `${date}_${unit}`;

    const targetPath =
        `productionTargets/${targetKey}`;

    get(
        child(
            ref(db),
            targetPath
        )
    )
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

            const targetData =
                snapshot.val();

            targetContainer.innerHTML =
                "";

            const filteredReports =
                allReports.filter(report =>
                    report.productionDate === date &&
                    report.unit === unit
                );

            const achievements =
                calculateAchievements(
                    filteredReports,
                    targetData.targets
                );

            renderTargetOverview(
                targetData.targets,
                achievements
            );

            Object.entries(
                targetData.targets
            ).forEach(
                ([process, targetValue]) => {

                    const achievement =
                        achievements[process] || 0;

                    const percentage =
                        targetValue > 0
                            ? (achievement / targetValue) * 100
                            : 0;

                    const percentageLabel =
                        Math.round(percentage);

                    const barWidth =
                        Math.min(
                            Math.max(
                                percentage,
                                0
                            ),
                            100
                        );

                    const item =
                        document.createElement("div");

                    item.className =
                        "target-item";

                    const colorClass =
                        processColors[process]
                        || "printing-bar";

                    const remaining =
                        Math.max(
                            0,
                            targetValue - achievement
                        );

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

                            <span>
                                Actual:
                                ${achievement.toFixed(2)} kg
                            </span>

                            <span>
                                ${percentageLabel}%
                            </span>

                            <span>
                                Target:
                                ${targetValue.toFixed(2)} kg
                            </span>

                        </div>
                    `;

                    targetContainer
                        .appendChild(item);

                }
            );

        })
        .catch(error => {

            console.error(
                "Error loading targets:",
                error
            );

            resetTargetOverview();

            targetContainer.innerHTML = `
                <p class="empty-message">
                    Error loading targets.
                </p>
            `;

        });
}


// =====================================================
// TARGET OVERVIEW
// =====================================================

function renderTargetOverview(
    targets,
    achievements
) {

    let totalTarget = 0;
    let totalAchieved = 0;

    Object.entries(targets)
        .forEach(
            ([process, target]) => {

                totalTarget +=
                    parseFloat(target) || 0;

                totalAchieved +=
                    parseFloat(
                        achievements[process] || 0
                    );

            }
        );

    const percentage =
        totalTarget > 0
            ? (totalAchieved / totalTarget) * 100
            : 0;

    const displayPercentage =
        Math.round(percentage);

    const remaining =
        Math.max(
            0,
            totalTarget - totalAchieved
        );

    targetOverallPercent.textContent =
        `${displayPercentage}%`;

    targetTotalTarget.textContent =
        `${totalTarget.toFixed(2)} kg`;

    targetTotalAchieved.textContent =
        `${totalAchieved.toFixed(2)} kg`;

    targetTotalRemaining.textContent =
        `${remaining.toFixed(2)} kg`;

    /*
        Use conic-gradient for the dashboard ring.
        Maximum visual fill is 100%, but achievement
        percentage itself can still show above 100%.
    */

    const ringPercentage =
        Math.min(
            Math.max(
                percentage,
                0
            ),
            100
        );

    const degree =
        ringPercentage * 3.6;

    targetProgressRing.style.display =
        "block";

    targetProgressRing.parentElement.style.background =
        `conic-gradient(
            #22c55e 0deg ${degree}deg,
            #e5e7eb ${degree}deg 360deg
        )`;

    if (percentage >= 100) {

        targetOverallPercent.style.color =
            "#15803d";

    } else if (percentage >= 80) {

        targetOverallPercent.style.color =
            "#ca8a04";

    } else {

        targetOverallPercent.style.color =
            "#dc2626";
    }
}


function resetTargetOverview() {

    targetOverallPercent.textContent =
        "0%";

    targetTotalTarget.textContent =
        "0 kg";

    targetTotalAchieved.textContent =
        "0 kg";

    targetTotalRemaining.textContent =
        "0 kg";

    targetProgressRing.parentElement.style.background =
        `conic-gradient(
            #e5e7eb 0deg,
            #e5e7eb 360deg
        )`;
}


// =====================================================
// CALCULATE TARGET ACHIEVEMENT
// =====================================================

function calculateAchievements(
    reports,
    targets
) {

    const achievements = {};

    Object.keys(targets)
        .forEach(process => {

            achievements[process] =
                0;

        });

    reports.forEach(report => {

        const machines =
            Array.isArray(report.machines)
                ? report.machines
                : Object.values(
                    report.machines || {}
                );

        machines.forEach(machine => {

            const process =
                machine.process ||
                "Other";

            if (
                Object.prototype
                    .hasOwnProperty
                    .call(
                        achievements,
                        process
                    )
            ) {

                const weight =
                    parseFloat(
                        machine.weight
                    ) || 0;

                achievements[process] +=
                    weight;
            }

        });

    });

    return achievements;
}


// =====================================================
// TARGET EVENT LISTENERS
// =====================================================

addTargetBtn.addEventListener(
    "click",
    openTargetModal
);

closeTargetModal.addEventListener(
    "click",
    closeTargetModalFunc
);

cancelTargetBtn.addEventListener(
    "click",
    closeTargetModalFunc
);

saveTargetBtn.addEventListener(
    "click",
    saveTarget
);

targetUnit.addEventListener(
    "change",
    populateProcessInputs
);


targetModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            targetModal
        ) {

            closeTargetModalFunc();

        }

    }
);


// =====================================================
// LOAD REPORTS FROM FIREBASE
// =====================================================

function loadReports() {

    loadingMessage.textContent =
        "Loading...";

    onValue(
        reportsRef,

        snapshot => {

            const data =
                snapshot.val();

            if (!data) {

                allReports = [];

            } else {

                allReports =
                    Object.entries(data)
                        .map(
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

        error => {

            console.error(
                "Firebase error:",
                error
            );

            loadingMessage.textContent =
                "Error loading reports";

            reportsContainer.innerHTML = `
                <p class="error-message">
                    Unable to load production reports.
                    Please check your internet connection
                    or Firebase settings.
                </p>
            `;

        }
    );
}


// =====================================================
// FILTER REPORTS
// =====================================================

function applyFilters() {

    const fromDate =
        reportFromDate
            ? reportFromDate.value
            : "";

    const toDate =
        reportToDate
            ? reportToDate.value
            : "";

    const selectedShift =
        shiftFilter.value;

    const selectedUnit =
        unitFilter.value;

    let filteredReports =
        [...allReports];


    // =================================================
    // DATE RANGE
    // =================================================

    if (fromDate) {

        filteredReports =
            filteredReports.filter(
                report =>
                    report.productionDate >=
                    fromDate
            );

    }

    if (toDate) {

        filteredReports =
            filteredReports.filter(
                report =>
                    report.productionDate <=
                    toDate
            );

    }


    // =================================================
    // SHIFT
    // =================================================

    if (selectedShift) {

        filteredReports =
            filteredReports.filter(
                report =>
                    report.shift ===
                    selectedShift
            );

    }


    // =================================================
    // UNIT
    // =================================================

    if (selectedUnit) {

        filteredReports =
            filteredReports.filter(
                report =>
                    report.unit ===
                    selectedUnit
            );

    }


    // =================================================
    // SORT
    // =================================================

    filteredReports.sort(
        (a, b) => {

            const timeA =
                Number(
                    a.entryTimestamp || 0
                );

            const timeB =
                Number(
                    b.entryTimestamp || 0
                );

            return timeB - timeA;
        }
    );


    renderReports(
        filteredReports
    );


    // =================================================
    // TARGET DISPLAY
    //
    // Target is daily, therefore it is displayed only
    // when exactly one date is selected.
    // =================================================

    if (
        fromDate &&
        toDate &&
        fromDate === toDate &&
        selectedUnit
    ) {

        displayTargets(
            fromDate,
            selectedUnit
        );

    } else {

        targetCard.classList.add(
            "hidden"
        );

    }

}


// =====================================================
// RENDER REPORTS
// =====================================================

function renderReports(
    reports
) {

    reportsContainer.innerHTML =
        "";

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

        updateReportsInfo(0);

        return;
    }


    reports.forEach(report => {

        const machines =
            Array.isArray(report.machines)
                ? report.machines
                : Object.values(
                    report.machines || {}
                );


        totalMachines +=
            machines.length;


        machines.forEach(machine => {

            const status =
                (
                    machine.status ||
                    ""
                ).toLowerCase();


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

    updateReportsInfo(
        reports.length
    );
}


// =====================================================
// REPORT INFO
// =====================================================

function updateReportsInfo(
    count
) {

    reportsResultInfo.textContent =
        `${count} report${count === 1 ? "" : "s"}`;
}


// =====================================================
// CREATE REPORT CARD
// =====================================================

function createReportCard(
    report
) {

    const card =
        document.createElement("div");

    card.className =
        "report-card";


    const machines =
        Array.isArray(report.machines)
            ? report.machines
            : Object.values(
                report.machines || {}
            );


    const reportHeader =
        document.createElement("div");

    reportHeader.className =
        "report-header";


    reportHeader.innerHTML = `

        <div class="report-title">
            Production Report
        </div>

        <div class="report-info">

            <span>
                <strong>Date:</strong>
                ${formatDate(
                    report.productionDate
                )}
            </span>

            <span>
                <strong>Shift:</strong>
                ${escapeHTML(
                    report.shift || "-"
                )}
            </span>

            <span>
                <strong>Unit:</strong>
                ${escapeHTML(
                    report.unit || "-"
                )}
            </span>

            <span>
                <strong>Supervisor:</strong>
                ${escapeHTML(
                    report.supervisor || "-"
                )}
            </span>

        </div>
    `;


    card.appendChild(
        reportHeader
    );


    // =================================================
    // ACTION BAR
    // =================================================

    const actionBar =
        document.createElement("div");

    actionBar.className =
        "report-action-bar";


    // COPY
    const copyButton =
        document.createElement("button");

    copyButton.className =
        "report-action-btn copy-btn";

    copyButton.title =
        "Copy Report";

    copyButton.setAttribute(
        "aria-label",
        "Copy Report"
    );

    copyButton.innerHTML = `
        <svg viewBox="0 0 24 24"
             aria-hidden="true">
            <path d="
                M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3
                4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2
                2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0
                16H8V7h11v14z">
            </path>
        </svg>
    `;


    copyButton.addEventListener(
        "click",
        async () => {

            const text =
                generateReportText(report);

            try {

                await navigator.clipboard
                    .writeText(text);

                showActionSuccess(
                    copyButton,
                    "Copied"
                );

            } catch (error) {

                console.error(
                    "Copy failed:",
                    error
                );

                const textarea =
                    document.createElement(
                        "textarea"
                    );

                textarea.value =
                    text;

                document.body.appendChild(
                    textarea
                );

                textarea.select();

                document.execCommand(
                    "copy"
                );

                document.body.removeChild(
                    textarea
                );

                showActionSuccess(
                    copyButton,
                    "Copied"
                );
            }

        }
    );


    // PRINT
    const printButton =
        document.createElement("button");

    printButton.className =
        "report-action-btn print-btn";

    printButton.title =
        "Print Report";

    printButton.setAttribute(
        "aria-label",
        "Print Report"
    );

    printButton.innerHTML = `
        <svg viewBox="0 0 24 24"
             aria-hidden="true">
            <path d="
                M19 8H5c-1.66 0-3 1.34-3 3v4h4v4h12v-4h4v-4
                c0-1.66-1.34-3-3-3zm-3 9H8v-5h8v5zm3-5c-.55
                0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z
                M18 3H6v4h12V3z">
            </path>
        </svg>
    `;

    printButton.addEventListener(
        "click",
        () => {
            printReport(report);
        }
    );


    // WHATSAPP
    const whatsappButton =
        document.createElement("button");

    whatsappButton.className =
        "report-action-btn whatsapp-btn";

    whatsappButton.title =
        "Share on WhatsApp";

    whatsappButton.setAttribute(
        "aria-label",
        "Share on WhatsApp"
    );

/* =====================================================
   START
===================================================== */

loadReports();
