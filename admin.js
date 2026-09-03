/* =====================================================
   APEX PRODUCTION REPORT
   ADMIN EDITOR
===================================================== */


/* =====================================================
   FIREBASE
===================================================== */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";


import {
    getDatabase,
    ref,
    onValue,
    update,
    remove
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";





/* =====================================================
   FIREBASE CONFIGURATION
===================================================== */

const firebaseConfig = {

    apiKey:
        "AIzaSyBVdV7BKtw1lBexUBSM90l2gRmg2vNE7RY",

    authDomain:
        "apex-production-report-90e12.firebaseapp.com",

    databaseURL:
        "https://apex-production-report-90e12-default-rtdb.asia-southeast1.firebasedatabase.app",

    projectId:
        "apex-production-report-90e12",

    storageBucket:
        "apex-production-report-90e12.firebasestorage.app",

    messagingSenderId:
        "857344599590",

    appId:
        "1:857344599590:web:d002e55d68d896afe0e8e7"

};


const firebaseApp =
    initializeApp(firebaseConfig);


const database =
    getDatabase(firebaseApp);





/* =====================================================
   MACHINE STRUCTURE
===================================================== */

const machineData = {

    "Unit 1": {

        "Printing": [
            "Printing 1",
            "Printing 2"
        ],

        "Lamination": [
            "Lamination 1",
            "Lamination 2"
        ],

        "Slitting": [
            "Slitting 1",
            "Slitting 2",
            "Slitting 3",
            "Slitting 4"
        ],

        "Doctoring": [
            "Doctoring 1",
            "Doctoring 2",
            "Doctoring 3"
        ],

        "Inspection": [
            "Inspection 1"
        ],

        "Extrusion Coating": [
            "Extrusion Coating 1"
        ]

    },


    "Unit 2": {

        "Printing": [
            "Printing 3",
            "Printing 4"
        ],

        "Lamination": [
            "Lamination 3",
            "Lamination 4",
            "Lamination 5"
        ],

        "Slitting": [
            "Slitting 5",
            "Slitting 6",
            "Slitting 7"
        ],

        "Doctoring": [
            "Doctoring 4",
            "Doctoring 5"
        ],

        "Inspection": [
            "Inspection 2"
        ],

        "Extrusion Coating": []

    }

};





/* =====================================================
   VARIABLES
===================================================== */

let allReports = [];

let currentReport = null;





/* =====================================================
   DOM ELEMENTS
===================================================== */

const reportsContainer =
    document.getElementById("reportsContainer");


const loadingMessage =
    document.getElementById("loadingMessage");


const reportCount =
    document.getElementById("reportCount");


const filterDate =
    document.getElementById("filterDate");


const filterShift =
    document.getElementById("filterShift");


const filterUnit =
    document.getElementById("filterUnit");


const searchText =
    document.getElementById("searchText");


const clearFilters =
    document.getElementById("clearFilters");


const refreshButton =
    document.getElementById("refreshButton");


const editModal =
    document.getElementById("editModal");


const closeModal =
    document.getElementById("closeModal");


const cancelEdit =
    document.getElementById("cancelEdit");


const saveChangesButton =
    document.getElementById("saveChangesButton");


const deleteReportButton =
    document.getElementById("deleteReportButton");


const addMachineButton =
    document.getElementById("addMachineButton");


const machinesEditor =
    document.getElementById("machinesEditor");





/* =====================================================
   LOAD REPORTS
===================================================== */

function loadReports() {

    loadingMessage.textContent =
        "Loading reports...";

    loadingMessage.style.display =
        "block";


    const reportsRef =
        ref(
            database,
            "productionReports"
        );


    onValue(
        reportsRef,

        function (snapshot) {

            const data =
                snapshot.val();


            if (!data) {

                allReports = [];

                renderReports();

                loadingMessage.textContent =
                    "No production reports found.";

                return;

            }


            allReports =
                Object.entries(data).map(
                    function ([id, report]) {

                        return {
                            id: id,
                            ...report
                        };

                    }
                );


            sortReports();

            renderReports();


            loadingMessage.style.display =
                "none";

        },

        function (error) {

            console.error(
                "Firebase loading error:",
                error
            );


            loadingMessage.textContent =
                "Unable to load reports. Please check Firebase connection.";

        }
    );

}





/* =====================================================
   SORT REPORTS
   NEWEST FIRST
===================================================== */

function sortReports() {

    allReports.sort(
        function (a, b) {

            const timeA =
                Number(
                    a.entryTimestamp || 0
                );


            const timeB =
                Number(
                    b.entryTimestamp || 0
                );


            if (timeA !== timeB) {

                return timeB - timeA;

            }


            return String(
                b.productionDate || ""
            ).localeCompare(
                String(
                    a.productionDate || ""
                )
            );

        }
    );

}





/* =====================================================
   RENDER REPORTS
===================================================== */

function renderReports() {

    const filtered =
        getFilteredReports();


    reportCount.textContent =
        `${filtered.length} report${filtered.length === 1 ? "" : "s"} found`;


    reportsContainer.innerHTML = "";


    if (filtered.length === 0) {

        reportsContainer.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    📭
                </div>

                <h3>
                    No reports found
                </h3>

                <p>
                    Try changing the filters or search text.
                </p>

            </div>

        `;

        return;

    }


    filtered.forEach(
        function (report) {

            reportsContainer.appendChild(
                createReportCard(report)
            );

        }
    );

}





/* =====================================================
   FILTER REPORTS
===================================================== */

function getFilteredReports() {

    const dateValue =
        filterDate.value;


    const shiftValue =
        filterShift.value;


    const unitValue =
        filterUnit.value;


    const searchValue =
        searchText.value
            .trim()
            .toLowerCase();


    return allReports.filter(
        function (report) {


            if (
                dateValue &&
                report.productionDate !== dateValue
            ) {

                return false;

            }


            if (
                shiftValue &&
                report.shift !== shiftValue
            ) {

                return false;

            }


            if (
                unitValue &&
                report.unit !== unitValue
            ) {

                return false;

            }


            if (searchValue) {

                const machines =
                    normalizeMachines(
                        report.machines
                    );


                const searchableText =
                    [

                        report.productionDate,

                        report.shift,

                        report.unit,

                        report.supervisor,

                        ...machines.map(
                            function (machine) {

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

                            }
                        )

                    ]
                    .join(" ")
                    .toLowerCase();


                if (
                    !searchableText.includes(
                        searchValue
                    )
                ) {

                    return false;

                }

            }


            return true;

        }
    );

}





/* =====================================================
   CREATE REPORT CARD
===================================================== */

function createReportCard(report) {

    const card =
        document.createElement("div");


    card.className =
        "report-card";


    const machines =
        normalizeMachines(
            report.machines
        );


    const productionMachines =
        machines.filter(
            function (item) {

                return item.status === "Production";

            }
        ).length;


    const idleMachines =
        machines.filter(
            function (item) {

                return item.status === "Idle";

            }
        ).length;


    const maintenanceMachines =
        machines.filter(
            function (item) {

                return item.status === "Maintenance";

            }
        ).length;


    card.innerHTML = `

        <div class="report-card-header">

            <div>

                <h3>
                    📅 ${escapeHTML(report.productionDate || "No Date")}
                </h3>

                <div class="report-meta">

                    <span>
                        Shift ${escapeHTML(report.shift || "-")}
                    </span>

                    <span>
                        ${escapeHTML(report.unit || "-")}
                    </span>

                    <span>
                        Supervisor:
                        ${escapeHTML(report.supervisor || "-")}
                    </span>

                </div>

            </div>


            <button
                type="button"
                class="edit-report-button"
            >
                ✏️ Edit Report
            </button>

        </div>


        <div class="report-summary">

            <span class="summary-total">
                ⚙️ ${machines.length} Machines
            </span>

            <span class="summary-production">
                🟢 ${productionMachines} Production
            </span>

            <span class="summary-idle">
                🟡 ${idleMachines} Idle
            </span>

            <span class="summary-maintenance">
                🔴 ${maintenanceMachines} Maintenance
            </span>

        </div>


        <div class="machine-preview">

            ${createMachinePreview(machines)}

        </div>

    `;


    card
        .querySelector(".edit-report-button")
        .addEventListener(
            "click",
            function () {

                openEditModal(report);

            }
        );


    return card;

}





/* =====================================================
   MACHINE PREVIEW
===================================================== */

function createMachinePreview(machines) {

    if (
        machines.length === 0
    ) {

        return `
            <div class="no-machines">
                No machine entries
            </div>
        `;

    }


    return machines.map(
        function (item, index) {

            let details = "";


            if (item.length) {

                details +=
                    `Length: ${escapeHTML(item.length)} m`;

            }


            if (item.weight) {

                details +=
                    `${details ? " • " : ""}Weight: ${escapeHTML(item.weight)} kg`;

            }


            if (item.speed) {

                details +=
                    `${details ? " • " : ""}Speed: ${escapeHTML(item.speed)}`;

            }


            if (item.product) {

                details +=
                    `${details ? " • " : ""}${escapeHTML(item.product)}`;

            }


            if (item.totalCoils) {

                details +=
                    `${details ? " • " : ""}Coils: ${escapeHTML(item.totalCoils)}`;

            }


            if (item.jobName) {

                details +=
                    `${details ? " • " : ""}Job: ${escapeHTML(item.jobName)}`;

            }


            return `

                <div class="machine-preview-row">

                    <div class="machine-preview-main">

                        <strong>
                            ${escapeHTML(item.machine || "Machine")}
                        </strong>

                        <span>
                            ${escapeHTML(item.process || "-")}
                        </span>

                    </div>


                    <span class="status-badge ${getStatusClass(item.status)}">

                        ${escapeHTML(item.status || "-")}

                    </span>


                    <div class="machine-preview-details">

                        ${details || "No production details"}

                    </div>

                </div>

            `;

        }
    ).join("");

}





/* =====================================================
   OPEN EDIT MODAL
===================================================== */

function openEditModal(report) {

    currentReport =
        JSON.parse(
            JSON.stringify(report)
        );


    document.getElementById(
        "editingReportId"
    ).textContent =
        `Report ID: ${report.id}`;


    document.getElementById(
        "editDate"
    ).value =
        report.productionDate || "";


    document.getElementById(
        "editShift"
    ).value =
        report.shift || "";


    document.getElementById(
        "editUnit"
    ).value =
        report.unit || "";


    document.getElementById(
        "editSupervisor"
    ).value =
        report.supervisor || "";


    renderMachineEditors();


    editModal.classList.remove(
        "hidden"
    );


    document.body.classList.add(
        "modal-open"
    );

}





/* =====================================================
   CLOSE EDIT MODAL
===================================================== */

function closeEditModal() {

    currentReport =
        null;


    editModal.classList.add(
        "hidden"
    );


    document.body.classList.remove(
        "modal-open"
    );

}





/* =====================================================
   NORMALIZE MACHINES
===================================================== */

function normalizeMachines(machines) {

    if (
        Array.isArray(machines)
    ) {

        return machines;

    }


    if (
        machines &&
        typeof machines === "object"
    ) {

        return Object.values(
            machines
        );

    }


    return [];

}





/* =====================================================
   RENDER MACHINE EDITORS
===================================================== */

function renderMachineEditors() {

    machinesEditor.innerHTML = "";


    if (!currentReport) {

        return;

    }


    const machines =
        normalizeMachines(
            currentReport.machines
        );


    if (machines.length === 0) {

        machinesEditor.innerHTML = `

            <div class="empty-machine-editor">

                No machine entries.

                <br><br>

                Click
                <strong>+ Add Machine</strong>
                to add one.

            </div>

        `;

        return;

    }


    machines.forEach(
        function (machineItem, index) {

            const editor =
                createMachineEditor(
                    machineItem,
                    index
                );


            machinesEditor.appendChild(
                editor
            );

        }
    );

}





/* =====================================================
   CREATE MACHINE EDITOR
===================================================== */

function createMachineEditor(
    machineItem,
    index
) {

    const card =
        document.createElement("div");


    card.className =
        "machine-editor-card";


    card.dataset.index =
        index;


    card.innerHTML = `

        <div class="machine-editor-header">

            <h4>
                Machine Entry #${index + 1}
            </h4>

            <button
                type="button"
                class="remove-machine-button"
            >
                🗑️ Remove Machine
            </button>

        </div>


        <div class="machine-editor-grid">


            <!-- UNIT -->

            <div class="form-group">

                <label>
                    Unit
                </label>

                <select class="machine-unit">

                    <option value="Unit 1">
                        Unit 1
                    </option>

                    <option value="Unit 2">
                        Unit 2
                    </option>

                </select>

            </div>


            <!-- PROCESS -->

            <div class="form-group">

                <label>
                    Process
                </label>

                <select class="machine-process">

                    <option value="">
                        Select Process
                    </option>

                </select>

            </div>


            <!-- MACHINE -->

            <div class="form-group">

                <label>
                    Machine
                </label>

                <select class="machine-name">

                    <option value="">
                        Select Machine
                    </option>

                </select>

            </div>


            <!-- STATUS -->

            <div class="form-group">

                <label>
                    Status
                </label>

                <select class="machine-status">

                    <option value="Production">
                        Production
                    </option>

                    <option value="Idle">
                        Idle
                    </option>

                    <option value="Maintenance">
                        Maintenance
                    </option>

                </select>

            </div>


        </div>


        <div class="production-fields">


            <div class="form-group">

                <label>
                    Length (m)
                </label>

                <input
                    type="text"
                    class="field-length"
                    placeholder="Length"
                >

            </div>


            <div class="form-group">

                <label>
                    Weight (kg)
                </label>

                <input
                    type="text"
                    class="field-weight"
                    placeholder="Weight"
                >

            </div>


            <div class="form-group">

                <label>
                    Speed
                </label>

                <input
                    type="text"
                    class="field-speed"
                    placeholder="Speed"
                >

            </div>


            <div class="form-group">

                <label>
                    Product
                </label>

                <input
                    type="text"
                    class="field-product"
                    placeholder="Product"
                >

            </div>


            <div class="form-group">

                <label>
                    Total Coils
                </label>

                <input
                    type="text"
                    class="field-total-coils"
                    placeholder="Total coils"
                >

            </div>


            <div class="form-group">

                <label>
                    Job Name
                </label>

                <input
                    type="text"
                    class="field-job-name"
                    placeholder="Job name"
                >

            </div>


            <div class="form-group full-width">

                <label>
                    Coil Details
                </label>

                <textarea
                    class="field-coil-details"
                    rows="4"
                    placeholder="Coil details"
                ></textarea>

            </div>


            <div class="form-group full-width">

                <label>
                    Remarks
                </label>

                <textarea
                    class="field-remarks"
                    rows="4"
                    placeholder="Problems / observations / remarks"
                ></textarea>

            </div>


        </div>

    `;


    const unitSelect =
        card.querySelector(
            ".machine-unit"
        );


    const processSelect =
        card.querySelector(
            ".machine-process"
        );


    const machineSelect =
        card.querySelector(
            ".machine-name"
        );


    const statusSelect =
        card.querySelector(
            ".machine-status"
        );


    unitSelect.value =
        machineItem.unit ||
        currentReport.unit ||
        "Unit 1";


    populateProcesses(
        processSelect,
        unitSelect.value
    );


    processSelect.value =
        machineItem.process || "";


    populateMachines(
        machineSelect,
        unitSelect.value,
        processSelect.value
    );


    machineSelect.value =
        machineItem.machine || "";


    statusSelect.value =
        machineItem.status ||
        "Production";


    card.querySelector(
        ".field-length"
    ).value =
        machineItem.length || "";


    card.querySelector(
        ".field-weight"
    ).value =
        machineItem.weight || "";


    card.querySelector(
        ".field-speed"
    ).value =
        machineItem.speed || "";


    card.querySelector(
        ".field-product"
    ).value =
        machineItem.product || "";


    card.querySelector(
        ".field-total-coils"
    ).value =
        machineItem.totalCoils || "";


    card.querySelector(
        ".field-job-name"
    ).value =
        machineItem.jobName || "";


    card.querySelector(
        ".field-coil-details"
    ).value =
        machineItem.coilDetails || "";


    card.querySelector(
        ".field-remarks"
    ).value =
        machineItem.remarks || "";


    /* UNIT CHANGE */

    unitSelect.addEventListener(
        "change",
        function () {

            populateProcesses(
                processSelect,
                unitSelect.value
            );


            processSelect.value =
                "";


            machineSelect.innerHTML =
                `<option value="">
                    Select Machine
                </option>`;

        }
    );


    /* PROCESS CHANGE */

    processSelect.addEventListener(
        "change",
        function () {

            populateMachines(
                machineSelect,
                unitSelect.value,
                processSelect.value
            );

        }
    );


    /* REMOVE */

    card
        .querySelector(
            ".remove-machine-button"
        )
        .addEventListener(
            "click",
            function () {

                const confirmed =
                    confirm(
                        "Remove this machine entry from the report?"
                    );


                if (!confirmed) {

                    return;

                }


                const indexToRemove =
                    Number(
                        card.dataset.index
                    );


                currentReport.machines =
                    normalizeMachines(
                        currentReport.machines
                    );


                currentReport.machines.splice(
                    indexToRemove,
                    1
                );


                renderMachineEditors();

            }
        );


    return card;

}





/* =====================================================
   POPULATE PROCESS DROPDOWN
===================================================== */

function populateProcesses(
    select,
    selectedUnit
) {

    select.innerHTML = `

        <option value="">
            Select Process
        </option>

    `;


    if (
        !machineData[selectedUnit]
    ) {

        return;

    }


    Object.keys(
        machineData[selectedUnit]
    ).forEach(
        function (processName) {

            const machines =
                machineData[
                    selectedUnit
                ][
                    processName
                ];


            if (
                machines.length > 0
            ) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    processName;


                option.textContent =
                    processName;


                select.appendChild(
                    option
                );

            }

        }
    );

}





/* =====================================================
   POPULATE MACHINE DROPDOWN
===================================================== */

function populateMachines(
    select,
    selectedUnit,
    selectedProcess
) {

    select.innerHTML = `

        <option value="">
            Select Machine
        </option>

    `;


    if (
        !selectedUnit ||
        !selectedProcess
    ) {

        return;

    }


    const machines =
        machineData[
            selectedUnit
        ][
            selectedProcess
        ] || [];


    machines.forEach(
        function (machineName) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                machineName;


            option.textContent =
                machineName;


            select.appendChild(
                option
            );

        }
    );

}





/* =====================================================
   ADD MACHINE
===================================================== */

addMachineButton.addEventListener(
    "click",
    function () {

        if (!currentReport) {

            return;

        }


        currentReport.machines =
            normalizeMachines(
                currentReport.machines
            );


        currentReport.machines.push({

            unit:
                currentReport.unit ||
                "Unit 1",

            process:
                "",

            machine:
                "",

            status:
                "Production",

            length:
                "",

            weight:
                "",

            speed:
                "",

            product:
                "",

            totalCoils:
                "",

            coilDetails:
                "",

            jobName:
                "",

            remarks:
                ""

        });


        renderMachineEditors();

    }
);





/* =====================================================
   COLLECT MACHINE DATA FROM FORM
===================================================== */

function collectMachineData() {

    const cards =
        machinesEditor.querySelectorAll(
            ".machine-editor-card"
        );


    const machines = [];


    cards.forEach(
        function (card) {

            const item = {

                unit:
                    card.querySelector(
                        ".machine-unit"
                    ).value,

                process:
                    card.querySelector(
                        ".machine-process"
                    ).value,

                machine:
                    card.querySelector(
                        ".machine-name"
                    ).value,

                status:
                    card.querySelector(
                        ".machine-status"
                    ).value,

                length:
                    card.querySelector(
                        ".field-length"
                    ).value.trim(),

                weight:
                    card.querySelector(
                        ".field-weight"
                    ).value.trim(),

                speed:
                    card.querySelector(
                        ".field-speed"
                    ).value.trim(),

                product:
                    card.querySelector(
                        ".field-product"
                    ).value.trim(),

                totalCoils:
                    card.querySelector(
                        ".field-total-coils"
                    ).value.trim(),

                coilDetails:
                    card.querySelector(
                        ".field-coil-details"
                    ).value.trim(),

                jobName:
                    card.querySelector(
                        ".field-job-name"
                    ).value.trim(),

                remarks:
                    card.querySelector(
                        ".field-remarks"
                    ).value.trim()

            };


            /*
             * Remove empty process-specific fields.
             *
             * This keeps Firebase cleaner and follows
             * the same structure as your app.js.
             */

            if (!item.length) {

                delete item.length;

            }


            if (!item.weight) {

                delete item.weight;

            }


            if (!item.speed) {

                delete item.speed;

            }


            if (!item.product) {

                delete item.product;

            }


            if (!item.totalCoils) {

                delete item.totalCoils;

            }


            if (!item.coilDetails) {

                delete item.coilDetails;

            }


            if (!item.jobName) {

                delete item.jobName;

            }


            if (!item.remarks) {

                delete item.remarks;

            }


            machines.push(item);

        }
    );


    return machines;

}





/* =====================================================
   SAVE CHANGES
===================================================== */

saveChangesButton.addEventListener(
    "click",
    async function () {

        if (!currentReport) {

            return;

        }


        const date =
            document.getElementById(
                "editDate"
            ).value;


        const selectedShift =
            document.getElementById(
                "editShift"
            ).value;


        const selectedUnit =
            document.getElementById(
                "editUnit"
            ).value;


        const selectedSupervisor =
            document.getElementById(
                "editSupervisor"
            ).value.trim();


        if (!date) {

            alert(
                "Please select Production Date."
            );

            return;

        }


        if (!selectedShift) {

            alert(
                "Please select Shift."
            );

            return;

        }


        if (!selectedUnit) {

            alert(
                "Please select Unit."
            );

            return;

        }


        if (!selectedSupervisor) {

            alert(
                "Please enter Supervisor Name."
            );

            return;

        }


        const machines =
            collectMachineData();


        for (
            let i = 0;
            i < machines.length;
            i++
        ) {

            if (!machines[i].unit) {

                alert(
                    `Machine Entry #${i + 1}: Please select Unit.`
                );

                return;

            }


            if (!machines[i].process) {

                alert(
                    `Machine Entry #${i + 1}: Please select Process.`
                );

                return;

            }


            if (!machines[i].machine) {

                alert(
                    `Machine Entry #${i + 1}: Please select Machine.`
                );

                return;

            }

        }


        const confirmed =
            confirm(
                "Save these changes to the existing report?"
            );


        if (!confirmed) {

            return;

        }


        saveChangesButton.disabled =
            true;


        saveChangesButton.textContent =
            "Saving...";


        try {

            const reportRef =
                ref(
                    database,
                    "productionReports/" +
                    currentReport.id
                );


            /*
             * IMPORTANT:
             *
             * We use update() here.
             *
             * This modifies the existing report.
             * It does NOT create a new report.
             */

            await update(
                reportRef,
                {

                    productionDate:
                        date,

                    shift:
                        selectedShift,

                    unit:
                        selectedUnit,

                    supervisor:
                        selectedSupervisor,

                    machines:
                        machines

                }
            );


            alert(
                "✅ Report corrected successfully!"
            );


            closeEditModal();

        }

        catch (error) {

            console.error(
                "Firebase update error:",
                error
            );


            alert(
                "❌ Could not save changes. Please try again."
            );

        }

        finally {

            saveChangesButton.disabled =
                false;


            saveChangesButton.textContent =
                "💾 Save Changes";

        }

    }
);





/* =====================================================
   DELETE ENTIRE REPORT
===================================================== */

deleteReportButton.addEventListener(
    "click",
    async function () {

        if (!currentReport) {

            return;

        }


        const firstConfirmation =
            confirm(
                "⚠️ DELETE ENTIRE REPORT?\n\n" +
                "Date: " +
                (currentReport.productionDate || "-") +
                "\nShift: " +
                (currentReport.shift || "-") +
                "\nUnit: " +
                (currentReport.unit || "-") +
                "\nSupervisor: " +
                (currentReport.supervisor || "-") +
                "\n\nThis cannot be undone."
            );


        if (!firstConfirmation) {

            return;

        }


        const secondConfirmation =
            confirm(
                "Are you absolutely sure?\n\n" +
                "The complete report and all its machine entries will be permanently deleted."
            );


        if (!secondConfirmation) {

            return;

        }


        deleteReportButton.disabled =
            true;


        deleteReportButton.textContent =
            "Deleting...";


        try {

            const reportRef =
                ref(
                    database,
                    "productionReports/" +
                    currentReport.id
                );


            await remove(
                reportRef
            );


            alert(
                "Report deleted successfully."
            );


            closeEditModal();

        }

        catch (error) {

            console.error(
                "Firebase delete error:",
                error
            );


            alert(
                "Could not delete report. Please try again."
            );

        }

        finally {

            deleteReportButton.disabled =
                false;


            deleteReportButton.textContent =
                "🗑️ Delete Entire Report";

        }

    }
);





/* =====================================================
   FILTER EVENTS
===================================================== */

filterDate.addEventListener(
    "change",
    renderReports
);


filterShift.addEventListener(
    "change",
    renderReports
);


filterUnit.addEventListener(
    "change",
    renderReports
);


searchText.addEventListener(
    "input",
    renderReports
);





/* =====================================================
   CLEAR FILTERS
===================================================== */

clearFilters.addEventListener(
    "click",
    function () {

        filterDate.value =
            "";


        filterShift.value =
            "";


        filterUnit.value =
            "";


        searchText.value =
            "";


        renderReports();

    }
);





/* =====================================================
   REFRESH
===================================================== */

refreshButton.addEventListener(
    "click",
    function () {

        sortReports();

        renderReports();

    }
);





/* =====================================================
   MODAL BUTTONS
===================================================== */

closeModal.addEventListener(
    "click",
    closeEditModal
);


cancelEdit.addEventListener(
    "click",
    closeEditModal
);





/* =====================================================
   CLOSE MODAL BY CLICKING OUTSIDE
===================================================== */

editModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target === editModal
        ) {

            closeEditModal();

        }

    }
);





/* =====================================================
   ESC KEY
===================================================== */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape" &&
            !editModal.classList.contains(
                "hidden"
            )
        ) {

            closeEditModal();

        }

    }
);





/* =====================================================
   STATUS CLASS
===================================================== */

function getStatusClass(status) {

    if (
        status === "Production"
    ) {

        return "status-production";

    }


    if (
        status === "Idle"
    ) {

        return "status-idle";

    }


    if (
        status === "Maintenance"
    ) {

        return "status-maintenance";

    }


    return "";

}





/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}





/* =====================================================
   START
===================================================== */

loadReports();
