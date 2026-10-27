/* =====================================================
   APEX PRODUCTION REPORT
   ADMIN EDITOR (WITH PENDING WIP SUPPORT)
===================================================== */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getDatabase,
    ref,
    onValue,
    update,
    remove,
    set,
    push,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

/* =====================================================
   FIREBASE CONFIGURATION
===================================================== */

const firebaseConfig = {
    apiKey: "AIzaSyBVdV7BKtw1lBexUBSM90l2gRmg2vNE7RY",
    authDomain: "apex-production-report-90e12.firebaseapp.com",
    databaseURL: "https://apex-production-report-90e12-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "apex-production-report-90e12",
    storageBucket: "apex-production-report-90e12.firebasestorage.app",
    messagingSenderId: "857344599590",
    appId: "1:857344599590:web:d002e55d68d896afe0e8e7"
};

const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

/* =====================================================
   MACHINE STRUCTURE
===================================================== */

const machineData = {
    "Unit 1": {
        "Printing": ["Printing 1", "Printing 2"],
        "Lamination": ["Lamination 1", "Lamination 2"],
        "Slitting": ["Slitting 1", "Slitting 2", "Slitting 3", "Slitting 4"],
        "Doctoring": ["Doctoring 1", "Doctoring 2"],
        "Inspection": ["Inspection 1"],
        "Extrusion Coating": ["Extrusion Coating 1"]
    },
    "Unit 2": {
        "Printing": ["Printing 3", "Printing 4"],
        "Lamination": ["Lamination 3", "Lamination 4", "Lamination 5"],
        "ColdSeal": ["ColdSeal"],
        "Slitting": ["Slitting 5", "Slitting 6", "Slitting 7"],
        "Doctoring": ["Doctoring 3", "Doctoring 4", "Doctoring 5"],
        "Inspection": ["Inspection 2"],
        "Extrusion Coating": []
    }
};

/* =====================================================
   VARIABLES
===================================================== */

let allReports = [];
let currentReport = null;

let allPendingWIP = [];
let currentWIP = null;
let activeTab = "reports"; // "reports" or "wip"

/* =====================================================
   DOM ELEMENTS
===================================================== */

const reportsContainer = document.getElementById("reportsContainer");
const loadingMessage = document.getElementById("loadingMessage");
const reportCount = document.getElementById("reportCount");
const filterDate = document.getElementById("filterDate");
const filterShift = document.getElementById("filterShift");
const filterUnit = document.getElementById("filterUnit");
const searchText = document.getElementById("searchText");
const clearFilters = document.getElementById("clearFilters");
const refreshButton = document.getElementById("refreshButton");

// Modal elements for Production Reports
const editModal = document.getElementById("editModal");
const closeModal = document.getElementById("closeModal");
const cancelEdit = document.getElementById("cancelEdit");
const saveChangesButton = document.getElementById("saveChangesButton");
const deleteReportButton = document.getElementById("deleteReportButton");
const addMachineButton = document.getElementById("addMachineButton");
const machinesEditor = document.getElementById("machinesEditor");

/* =====================================================
   TAB NAVIGATION HANDLERS (Reports vs Pending WIP)
===================================================== */

document.querySelectorAll(".dashboard-tab").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".dashboard-tab").forEach(tab => tab.classList.remove("active"));
        button.classList.add("active");
        
        activeTab = button.dataset.tab; // expected values: "reports" or "wip"
        
        if (activeTab === "wip") {
            loadPendingWIP();
        } else {
            loadReports();
        }
    });
});

/* =====================================================
   LOAD REPORTS
===================================================== */

function loadReports() {
    loadingMessage.textContent = "Loading reports...";
    loadingMessage.style.display = "block";

    const reportsRef = ref(database, "productionReports");

    onValue(reportsRef, function (snapshot) {
        const data = snapshot.val();

        if (!data) {
            allReports = [];
            renderReports();
            loadingMessage.textContent = "No production reports found.";
            return;
        }

        allReports = Object.entries(data).map(function ([id, report]) {
            return {
                id: id,
                ...report
            };
        });

        sortReports();
        renderReports();
        loadingMessage.style.display = "none";
    }, function (error) {
        console.error("Firebase loading error:", error);
        loadingMessage.textContent = "Unable to load reports. Please check Firebase connection.";
    });
}

/* =====================================================
   LOAD PENDING WIP ROLLS
===================================================== */

function loadPendingWIP() {
    loadingMessage.textContent = "Loading Pending WIP rolls...";
    loadingMessage.style.display = "block";

    const wipRef = ref(database, "pendingWIP");

    onValue(wipRef, function (snapshot) {
        const data = snapshot.val();

        if (!data) {
            allPendingWIP = [];
            renderPendingWIPList();
            loadingMessage.textContent = "No Pending WIP rolls found.";
            return;
        }

        allPendingWIP = Object.entries(data).map(function ([id, record]) {
            return {
                id: id,
                ...record
            };
        });

        renderPendingWIPList();
        loadingMessage.style.display = "none";
    }, function (error) {
        console.error("Firebase WIP loading error:", error);
        loadingMessage.textContent = "Unable to load Pending WIP rolls.";
    });
}

/* =====================================================
   SORT REPORTS (NEWEST FIRST)
===================================================== */

function sortReports() {
    allReports.sort(function (a, b) {
        const timeA = Number(a.entryTimestamp || 0);
        const timeB = Number(b.entryTimestamp || 0);

        if (timeA !== timeB) {
            return timeB - timeA;
        }

        return String(b.productionDate || "").localeCompare(String(a.productionDate || ""));
    });
}

/* =====================================================
   RENDER REPORTS
===================================================== */

function renderReports() {
    if (activeTab !== "reports") return;
    const filtered = getFilteredReports();
    reportCount.textContent = `${filtered.length} report${filtered.length === 1 ? "" : "s"} found`;
    reportsContainer.innerHTML = "";

    if (filtered.length === 0) {
        reportsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <h3>No reports found</h3>
                <p>Try changing the filters or search text.</p>
            </div>
        `;
        return;
    }

    filtered.forEach(function (report) {
        reportsContainer.appendChild(createReportCard(report));
    });
}

/* =====================================================
   RENDER PENDING WIP LIST
===================================================== */

function renderPendingWIPList() {
    if (activeTab !== "wip") return;
    
    const searchValue = searchText.value.trim().toLowerCase();
    const filtered = allPendingWIP.filter(item => {
        if (!searchValue) return true;
        const searchable = [
            item.jobNo,
            item.jobName,
            item.status,
            item.rollNo,
            item.productionDate,
            item.remarkOnLabel,
            item.responsiblePerson
        ].join(" ").toLowerCase();
        return searchable.includes(searchValue);
    });

    reportCount.textContent = `${filtered.length} Pending WIP roll${filtered.length === 1 ? "" : "s"} found`;
    reportsContainer.innerHTML = "";

    if (filtered.length === 0) {
        reportsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <h3>No Pending WIP rolls found</h3>
            </div>
        `;
        return;
    }

    filtered.forEach(function (record) {
        reportsContainer.appendChild(createWIPCard(record));
    });
}

/* =====================================================
   CREATE PENDING WIP CARD FOR ADMIN VIEW
===================================================== */

function createWIPCard(record) {
    const card = document.createElement("div");
    card.className = "report-card";

    card.innerHTML = `
        <div class="report-card-header">
            <div>
                <h3>🏷️ Job No: ${escapeHTML(record.jobNo || "-")} (${escapeHTML(record.jobName || "-")})</h3>
                <div class="report-meta">
                    <span>Status: <strong>${escapeHTML(record.status || "-")}</strong></span>
                    <span>Roll No: ${escapeHTML(record.rollNo || "-")}</span>
                    <span>Weight: ${escapeHTML(record.weight || "-")} kg</span>
                    <span>Date: ${escapeHTML(record.productionDate || "-")}</span>
                </div>
            </div>
            <button type="button" class="edit-wip-button">✏️ Edit WIP</button>
        </div>
        <div class="machine-preview">
            <div class="machine-preview-row">
                <div class="machine-preview-details">
                    <strong>Responsible Person:</strong> ${escapeHTML(record.responsiblePerson || "Not Assigned")} <br>
                    <strong>Remark on Label:</strong> ${escapeHTML(record.remarkOnLabel || "-")}
                </div>
            </div>
        </div>
    `;

    card.querySelector(".edit-wip-button").addEventListener("click", function () {
        openWIPEditModal(record);
    });

    return card;
}

/* =====================================================
   FILTER REPORTS
===================================================== */

function getFilteredReports() {
    const dateValue = filterDate.value;
    const shiftValue = filterShift.value;
    const unitValue = filterUnit.value;
    const searchValue = searchText.value.trim().toLowerCase();

    return allReports.filter(function (report) {
        if (dateValue && report.productionDate !== dateValue) {
            return false;
        }

        if (shiftValue && String(report.shift || "").toLowerCase().trim() !== String(shiftValue).toLowerCase().trim()) {
            return false;
        }

        if (unitValue && report.unit !== unitValue) {
            return false;
        }

        if (searchValue) {
            const machines = normalizeMachines(report.machines);
            const searchableText = [
                report.productionDate,
                report.shift,
                report.unit,
                report.supervisor,
                ...machines.map(function (machine) {
                    return [
                        machine.unit,
                        machine.process,
                        machine.machine,
                        machine.status,
                        machine.product,
                        machine.jobName,
                        machine.remarks,
                        machine.coilDetails
                    ].join(" ");
                })
            ].join(" ").toLowerCase();

            if (!searchableText.includes(searchValue)) {
                return false;
            }
        }

        return true;
    });
}

/* =====================================================
   CREATE REPORT CARD
===================================================== */

function createReportCard(report) {
    const card = document.createElement("div");
    card.className = "report-card";

    const machines = normalizeMachines(report.machines);

    const productionMachines = machines.filter(function (item) {
        return item.status === "Production";
    }).length;

    const idleMachines = machines.filter(function (item) {
        return item.status === "Idle";
    }).length;

    const maintenanceMachines = machines.filter(function (item) {
        return item.status === "Maintenance";
    }).length;

    card.innerHTML = `
        <div class="report-card-header">
            <div>
                <h3>📅 ${escapeHTML(report.productionDate || "No Date")}</h3>
                <div class="report-meta">
                    <span>Shift ${escapeHTML(report.shift || "-")}</span>
                    <span>${escapeHTML(report.unit || "-")}</span>
                    <span>Supervisor: ${escapeHTML(report.supervisor || "-")}</span>
                </div>
            </div>
            <button type="button" class="edit-report-button">✏️ Edit Report</button>
        </div>
        <div class="report-summary">
            <span class="summary-total">⚙️ ${machines.length} Machines</span>
            <span class="summary-production">🟢 ${productionMachines} Production</span>
            <span class="summary-idle">🟡 ${idleMachines} Idle</span>
            <span class="summary-maintenance">🔴 ${maintenanceMachines} Maintenance</span>
        </div>
        <div class="machine-preview">
            ${createMachinePreview(machines)}
        </div>
    `;

    card.querySelector(".edit-report-button").addEventListener("click", function () {
        openEditModal(report);
    });

    return card;
}

/* =====================================================
   MACHINE PREVIEW
===================================================== */

function createMachinePreview(machines) {
    if (machines.length === 0) {
        return `<div class="no-machines">No machine entries</div>`;
    }

    return machines.map(function (item) {
        let details = "";

        if (item.length) {
            details += `Length: ${escapeHTML(item.length)} m`;
        }
        if (item.weight) {
            details += `${details ? " • " : ""}Weight: ${escapeHTML(item.weight)} kg`;
        }
        if (item.speed) {
            details += `${details ? " • " : ""}Speed: ${escapeHTML(item.speed)}`;
        }
        if (item.reels) {
            details += `${details ? " • " : ""}Reels: ${escapeHTML(item.reels)}`;
        }
        if (item.hold_reels) {
            details += `${details ? " • " : ""}Hold Reels: ${escapeHTML(item.hold_reels)}`;
        }
        if (item.product) {
            details += `${details ? " • " : ""}${escapeHTML(item.product)}`;
        }
        if (item.totalCoils) {
            details += `${details ? " • " : ""}Coils: ${escapeHTML(item.totalCoils)}`;
        }
        if (item.jobName) {
            details += `${details ? " • " : ""}Job: ${escapeHTML(item.jobName)}`;
        }

        return `
            <div class="machine-preview-row">
                <div class="machine-preview-main">
                    <strong>${escapeHTML(item.machine || "Machine")}</strong>
                    <span>${escapeHTML(item.process || "-")}</span>
                </div>
                <span class="status-badge ${getStatusClass(item.status)}">${escapeHTML(item.status || "-")}</span>
                <div class="machine-preview-details">${details || "No production details"}</div>
            </div>
        `;
    }).join("");
}

/* =====================================================
   OPEN / CLOSE EDIT MODALS
===================================================== */

function openEditModal(report) {
    currentReport = JSON.parse(JSON.stringify(report));

    document.getElementById("editingReportId").textContent = `Report ID: ${report.id}`;
    document.getElementById("editDate").value = report.productionDate || "";
    document.getElementById("editShift").value = report.shift || "";
    document.getElementById("editUnit").value = report.unit || "";
    document.getElementById("editSupervisor").value = report.supervisor || "";

    renderMachineEditors();

    editModal.classList.remove("hidden");
    document.body.classList.add("modal-open");
}

function openWIPEditModal(record) {
    currentWIP = JSON.parse(JSON.stringify(record));

    // Create or reuse an edit modal structure for WIP items
    let wipModal = document.getElementById("wipEditModal");
    if (!wipModal) {
        // Dynamically inject modal HTML if it doesn't exist in HTML template
        const modalDiv = document.createElement("div");
        modalDiv.id = "wipEditModal";
        modalDiv.className = "modal hidden";
        modalDiv.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Edit Pending WIP Roll</h2>
                    <button class="modal-close" id="closeWIPModal">&times;</button>
                </div>
                <div class="modal-body">
                    <p id="editingWIPId" style="font-size: 12px; color: #6b7280; margin-bottom: 10px;"></p>
                    <div class="form-group"><label>Job No.</label><input type="text" id="editWipJobNo"></div>
                    <div class="form-group"><label>Job Name</label><input type="text" id="editWipJobName"></div>
                    <div class="form-group"><label>Status</label>
                        <select id="editWipStatus">
                            <option value="Pending Printing">Pending Printing</option>
                            <option value="Pending Lamination">Pending Lamination</option>
                            <option value="Pending Slitting">Pending Slitting</option>
                            <option value="Pending Coating">Pending Coating</option>
                            <option value="Pending QC">Pending QC</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="form-group"><label>Roll No.</label><input type="text" id="editWipRollNo"></div>
                    <div class="form-group"><label>Weight (kg)</label><input type="number" id="editWipWeight" step="any"></div>
                    <div class="form-group"><label>Production Date</label><input type="date" id="editWipProductionDate"></div>
                    <div class="form-group"><label>Responsible Person</label><input type="text" id="editWipResponsiblePerson"></div>
                    <div class="form-group"><label>Remark on Label</label><input type="text" id="editWipRemarkOnLabel"></div>
                </div>
                <div class="modal-footer" style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                    <button type="button" id="deleteWIPButton" class="secondary-button" style="background: #dc2626; color: #fff;">🗑️ Delete Roll</button>
                    <button type="button" id="cancelWIPEdit" class="secondary-button">Cancel</button>
                    <button type="button" id="saveWIPChangesButton" class="primary-button">💾 Save Changes</button>
                </div>
            </div>
        `;
        document.body.appendChild(modalDiv);
        wipModal = modalDiv;

        // Bind events for dynamically created modal
        document.getElementById("closeWIPModal").addEventListener("click", closeWIPEditModal);
        document.getElementById("cancelWIPEdit").addEventListener("click", closeWIPEditModal);
        document.getElementById("saveWIPChangesButton").addEventListener("click", saveWIPChanges);
        document.getElementById("deleteWIPButton").addEventListener("click", deleteWIPRecord);
    }

    document.getElementById("editingWIPId").textContent = `Record ID: ${record.id}`;
    document.getElementById("editWipJobNo").value = record.jobNo || "";
    document.getElementById("editWipJobName").value = record.jobName || "";
    document.getElementById("editWipStatus").value = record.status || "";
    document.getElementById("editWipRollNo").value = record.rollNo || "";
    document.getElementById("editWipWeight").value = record.weight || "";
    document.getElementById("editWipProductionDate").value = record.productionDate || "";
    document.getElementById("editWipResponsiblePerson").value = record.responsiblePerson || "";
    document.getElementById("editWipRemarkOnLabel").value = record.remarkOnLabel || "";

    wipModal.classList.remove("hidden");
    document.body.classList.add("modal-open");
}

function closeWIPEditModal() {
    currentWIP = null;
    const wipModal = document.getElementById("wipEditModal");
    if (wipModal) wipModal.classList.add("hidden");
    document.body.classList.remove("modal-open");
}

function closeEditModal() {
    currentReport = null;
    editModal.classList.add("hidden");
    document.body.classList.remove("modal-open");
}

/* =====================================================
   SAVE WIP CHANGES TO FIREBASE
===================================================== */

async function saveWIPChanges() {
    if (!currentWIP) return;

    const jobNo = document.getElementById("editWipJobNo").value.trim();
    const jobName = document.getElementById("editWipJobName").value.trim();
    const status = document.getElementById("editWipStatus").value;
    const rollNo = document.getElementById("editWipRollNo").value.trim();
    const weight = document.getElementById("editWipWeight").value;
    const productionDate = document.getElementById("editWipProductionDate").value;
    const responsiblePerson = document.getElementById("editWipResponsiblePerson").value.trim();
    const remarkOnLabel = document.getElementById("editWipRemarkOnLabel").value.trim();

    if (!jobNo || !jobName || !status || !rollNo || !weight || !productionDate) {
        alert("Please fill out all required fields.");
        return;
    }

    if (!confirm("Save updates to this Pending WIP roll?")) return;

    try {
        const wipRef = ref(database, "pendingWIP/" + currentWIP.id);
        await update(wipRef, {
            jobNo,
            jobName,
            status,
            rollNo,
            weight: Number(weight),
            productionDate,
            responsiblePerson,
            remarkOnLabel
        });

        alert("✅ Pending WIP roll updated successfully!");
        closeWIPEditModal();
        loadPendingWIP();
    } catch (error) {
        console.error("Error updating WIP:", error);
        alert("❌ Could not save changes.");
    }
}

async function deleteWIPRecord() {
    if (!currentWIP) return;
    if (!confirm("⚠️ DELETE THIS PENDING WIP ROLL?\n\nThis cannot be undone.")) return;

    try {
        const wipRef = ref(database, "pendingWIP/" + currentWIP.id);
        await remove(wipRef);
        alert("Pending WIP roll deleted.");
        closeWIPEditModal();
        loadPendingWIP();
    } catch (error) {
        console.error("Error deleting WIP:", error);
        alert("Could not delete record.");
    }
}

/* =====================================================
   NORMALIZE MACHINES
===================================================== */

function normalizeMachines(machines) {
    if (Array.isArray(machines)) {
        return machines;
    }
    if (machines && typeof machines === "object") {
        return Object.values(machines);
    }
    return [];
}

/* =====================================================
   RENDER MACHINE EDITORS
===================================================== */

function renderMachineEditors() {
    machinesEditor.innerHTML = "";
    if (!currentReport) return;

    const machines = normalizeMachines(currentReport.machines);

    if (machines.length === 0) {
        machinesEditor.innerHTML = `
            <div class="empty-machine-editor">
                No machine entries.<br><br>Click <strong>+ Add Machine</strong> to add one.
            </div>
        `;
        return;
    }

    machines.forEach(function (machineItem, index) {
        const editor = createMachineEditor(machineItem, index);
        machinesEditor.appendChild(editor);
    });
}

/* =====================================================
   CREATE MACHINE EDITOR
===================================================== */

function createMachineEditor(machineItem, index) {
    const card = document.createElement("div");
    card.className = "machine-editor-card";
    card.dataset.index = index;

    card.innerHTML = `
        <div class="machine-editor-header">
            <h4>Machine Entry #${index + 1}</h4>
            <button type="button" class="remove-machine-button">🗑️ Remove Machine</button>
        </div>
        <div class="machine-editor-grid">
            <div class="form-group">
                <label>Unit</label>
                <select class="machine-unit">
                    <option value="Unit 1">Unit 1</option>
                    <option value="Unit 2">Unit 2</option>
                </select>
            </div>
            <div class="form-group">
                <label>Process</label>
                <select class="machine-process">
                    <option value="">Select Process</option>
                </select>
            </div>
            <div class="form-group">
                <label>Machine</label>
                <select class="machine-name">
                    <option value="">Select Machine</option>
                </select>
            </div>
            <div class="form-group">
                <label>Status</label>
                <select class="machine-status">
                    <option value="Production">Production</option>
                    <option value="Idle">Idle</option>
                    <option value="Maintenance">Maintenance</option>
                </select>
            </div>
        </div>
        <div class="production-fields">
            <div class="form-group">
                <label>Length (m)</label>
                <input type="text" class="field-length" placeholder="Length">
            </div>
            <div class="form-group">
                <label>Weight (kg)</label>
                <input type="text" class="field-weight" placeholder="Weight">
            </div>
            <div class="form-group">
                <label>Speed</label>
                <input type="text" class="field-speed" placeholder="Speed">
            </div>
            <div class="form-group">
                <label>Reels (Nos)</label>
                <input type="text" class="field-reels" placeholder="Reels">
            </div>
            <div class="form-group">
                <label>Hold Reels (Nos)</label>
                <input type="text" class="field-hold-reels" placeholder="Hold Reels">
            </div>
            <div class="form-group">
                <label>Product</label>
                <input type="text" class="field-product" placeholder="Product">
            </div>
            <div class="form-group">
                <label>Total Coils</label>
                <input type="text" class="field-total-coils" placeholder="Total coils">
            </div>
            <div class="form-group">
                <label>Job Name</label>
                <input type="text" class="field-job-name" placeholder="Job name">
            </div>
            <div class="form-group full-width">
                <label>Coil Details</label>
                <textarea class="field-coil-details" rows="4" placeholder="Coil details"></textarea>
            </div>
            <div class="form-group full-width">
                <label>Remarks</label>
                <textarea class="field-remarks" rows="4" placeholder="Problems / observations / remarks"></textarea>
            </div>
        </div>
    `;

    const unitSelect = card.querySelector(".machine-unit");
    const processSelect = card.querySelector(".machine-process");
    const machineSelect = card.querySelector(".machine-name");
    const statusSelect = card.querySelector(".machine-status");

    unitSelect.value = machineItem.unit || currentReport.unit || "Unit 1";
    populateProcesses(processSelect, unitSelect.value);
    processSelect.value = machineItem.process || "";
    populateMachines(machineSelect, unitSelect.value, processSelect.value);
    machineSelect.value = machineItem.machine || "";
    statusSelect.value = machineItem.status || "Production";

    card.querySelector(".field-length").value = machineItem.length || "";
    card.querySelector(".field-weight").value = machineItem.weight || "";
    card.querySelector(".field-speed").value = machineItem.speed || "";
    card.querySelector(".field-reels").value = machineItem.reels || "";
    card.querySelector(".field-hold-reels").value = machineItem.hold_reels || "";
    card.querySelector(".field-product").value = machineItem.product || "";
    card.querySelector(".field-total-coils").value = machineItem.totalCoils || "";
    card.querySelector(".field-job-name").value = machineItem.jobName || "";
    card.querySelector(".field-coil-details").value = machineItem.coilDetails || "";
    card.querySelector(".field-remarks").value = machineItem.remarks || "";

    unitSelect.addEventListener("change", function () {
        populateProcesses(processSelect, unitSelect.value);
        processSelect.value = "";
        machineSelect.innerHTML = `<option value="">Select Machine</option>`;
    });

    processSelect.addEventListener("change", function () {
        populateMachines(machineSelect, unitSelect.value, processSelect.value);
    });

    card.querySelector(".remove-machine-button").addEventListener("click", function () {
        if (!confirm("Remove this machine entry from the report?")) return;
        const indexToRemove = Number(card.dataset.index);
        currentReport.machines = normalizeMachines(currentReport.machines);
        currentReport.machines.splice(indexToRemove, 1);
        renderMachineEditors();
    });

    return card;
}

/* =====================================================
   POPULATE DROPDOWNS
===================================================== */

function populateProcesses(select, selectedUnit) {
    select.innerHTML = `<option value="">Select Process</option>`;
    if (!machineData[selectedUnit]) return;

    Object.keys(machineData[selectedUnit]).forEach(function (processName) {
        const machines = machineData[selectedUnit][processName];
        if (machines.length > 0) {
            const option = document.createElement("option");
            option.value = processName;
            option.textContent = processName;
            select.appendChild(option);
        }
    });
}

function populateMachines(select, selectedUnit, selectedProcess) {
    select.innerHTML = `<option value="">Select Machine</option>`;
    if (!selectedUnit || !selectedProcess) return;

    const machines = machineData[selectedUnit][selectedProcess] || [];
    machines.forEach(function (machineName) {
        const option = document.createElement("option");
        option.value = machineName;
        option.textContent = machineName;
        select.appendChild(option);
    });
}

/* =====================================================
   ADD MACHINE
===================================================== */

addMachineButton.addEventListener("click", function () {
    if (!currentReport) return;

    currentReport.machines = normalizeMachines(currentReport.machines);
    currentReport.machines.push({
        unit: currentReport.unit || "Unit 1",
        process: "",
        machine: "",
        status: "Production",
        length: "",
        weight: "",
        speed: "",
        reels: "",
        hold_reels: "",
        product: "",
        totalCoils: "",
        coilDetails: "",
        jobName: "",
        remarks: ""
    });

    renderMachineEditors();
});

/* =====================================================
   COLLECT MACHINE DATA FROM FORM
===================================================== */

function collectMachineData() {
    const cards = machinesEditor.querySelectorAll(".machine-editor-card");
    const machines = [];

    cards.forEach(function (card) {
        const item = {
            unit: card.querySelector(".machine-unit").value,
            process: card.querySelector(".machine-process").value,
            machine: card.querySelector(".machine-name").value,
            status: card.querySelector(".machine-status").value,
            length: card.querySelector(".field-length").value.trim(),
            weight: card.querySelector(".field-weight").value.trim(),
            speed: card.querySelector(".field-speed").value.trim(),
            reels: card.querySelector(".field-reels").value.trim(),
            hold_reels: card.querySelector(".field-hold-reels").value.trim(),
            product: card.querySelector(".field-product").value.trim(),
            totalCoils: card.querySelector(".field-total-coils").value.trim(),
            coilDetails: card.querySelector(".field-coil-details").value.trim(),
            jobName: card.querySelector(".field-job-name").value.trim(),
            remarks: card.querySelector(".field-remarks").value.trim()
        };

        if (!item.length) delete item.length;
        if (!item.weight) delete item.weight;
        if (!item.speed) delete item.speed;
        if (!item.reels) delete item.reels;
        if (!item.hold_reels) delete item.hold_reels;
        if (!item.product) delete item.product;
        if (!item.totalCoils) delete item.totalCoils;
        if (!item.coilDetails) delete item.coilDetails;
        if (!item.jobName) delete item.jobName;
        if (!item.remarks) delete item.remarks;

        machines.push(item);
    });

    return machines;
}

/* =====================================================
   SAVE CHANGES (REPORTS)
===================================================== */

saveChangesButton.addEventListener("click", async function () {
    if (!currentReport) return;

    const date = document.getElementById("editDate").value;
    const selectedShift = document.getElementById("editShift").value;
    const selectedUnit = document.getElementById("editUnit").value;
    const selectedSupervisor = document.getElementById("editSupervisor").value.trim();

    if (!date) { alert("Please select Production Date."); return; }
    if (!selectedShift) { alert("Please select Shift."); return; }
    if (!selectedUnit) { alert("Please select Unit."); return; }
    if (!selectedSupervisor) { alert("Please enter Supervisor Name."); return; }

    const machines = collectMachineData();

    for (let i = 0; i < machines.length; i++) {
        if (!machines[i].unit) { alert(`Machine Entry #${i + 1}: Please select Unit.`); return; }
        if (!machines[i].process) { alert(`Machine Entry #${i + 1}: Please select Process.`); return; }
        if (!machines[i].machine) { alert(`Machine Entry #${i + 1}: Please select Machine.`); return; }
    }

    if (!confirm("Save these changes to the existing report?")) return;

    saveChangesButton.disabled = true;
    saveChangesButton.textContent = "Saving...";

    try {
        const reportRef = ref(database, "productionReports/" + currentReport.id);

        await update(reportRef, {
            productionDate: date,
            shift: selectedShift,
            unit: selectedUnit,
            supervisor: selectedSupervisor,
            machines: machines
        });

        alert("✅ Report corrected successfully!");
        closeEditModal();
        loadReports();
    } catch (error) {
        console.error("Firebase update error:", error);
        alert("❌ Could not save changes. Please try again.");
    } finally {
        saveChangesButton.disabled = false;
        saveChangesButton.textContent = "💾 Save Changes";
    }
});

/* =====================================================
   DELETE ENTIRE REPORT
===================================================== */

deleteReportButton.addEventListener("click", async function () {
    if (!currentReport) return;

    if (!confirm("⚠️ DELETE ENTIRE REPORT?\n\nThis cannot be undone.")) return;
    if (!confirm("Are you absolutely sure?")) return;

    deleteReportButton.disabled = true;
    deleteReportButton.textContent = "Deleting...";

    try {
        const reportRef = ref(database, "productionReports/" + currentReport.id);
        await remove(reportRef);
        alert("Report deleted successfully.");
        closeEditModal();
        loadReports();
    } catch (error) {
        console.error("Firebase delete error:", error);
        alert("Could not delete report. Please try again.");
    } finally {
        deleteReportButton.disabled = false;
        deleteReportButton.textContent = "🗑️ Delete Entire Report";
    }
});

/* =====================================================
   EVENTS & UTILITIES
===================================================== */

filterDate.addEventListener("change", () => { activeTab === "reports" ? renderReports() : renderPendingWIPList(); });
filterShift.addEventListener("input", () => { activeTab === "reports" ? renderReports() : renderPendingWIPList(); });
filterUnit.addEventListener("change", () => { activeTab === "reports" ? renderReports() : renderPendingWIPList(); });
searchText.addEventListener("input", () => { activeTab === "reports" ? renderReports() : renderPendingWIPList(); });

clearFilters.addEventListener("click", function () {
    filterDate.value = "";
    filterShift.value = "";
    filterUnit.value = "";
    searchText.value = "";
    activeTab === "reports" ? renderReports() : renderPendingWIPList();
});

refreshButton.addEventListener("click", function () {
    if (activeTab === "reports") {
        sortReports();
        renderReports();
    } else {
        loadPendingWIP();
    }
});

closeModal.addEventListener("click", closeEditModal);
cancelEdit.addEventListener("click", closeEditModal);

editModal.addEventListener("click", function (event) {
    if (event.target === editModal) closeEditModal();
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        if (!editModal.classList.contains("hidden")) closeEditModal();
        const wipModal = document.getElementById("wipEditModal");
        if (wipModal && !wipModal.classList.contains("hidden")) closeWIPEditModal();
    }
});

function getStatusClass(status) {
    if (status === "Production") return "status-production";
    if (status === "Idle") return "status-idle";
    if (status === "Maintenance") return "status-maintenance";
    return "";
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

loadReports();
