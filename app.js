import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getDatabase,
    ref,
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
            "Doctoring 2"
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

        "ColdSeal": [
            "ColdSeal"
        ],

        "Slitting": [
            "Slitting 5",
            "Slitting 6",
            "Slitting 7"
        ],

        "Doctoring": [
            "Doctoring 3",
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
   DOM ELEMENTS
===================================================== */

const reportDate =
    document.getElementById("reportDate");

const shift =
    document.getElementById("shift");

const unit =
    document.getElementById("unit");

const supervisor =
    document.getElementById("supervisor");

const process =
    document.getElementById("process");

const machine =
    document.getElementById("machine");

const machineForm =
    document.getElementById("machineForm");

const entries =
    document.getElementById("entries");

const saveMachineReport =
    document.getElementById("saveMachineReport");

const submitShiftReport =
    document.getElementById("submitShiftReport");


/* =====================================================
   LOCAL DRAFT STORAGE
===================================================== */

/*
   IMPORTANT:

   This draft is stored in the browser of the data-entry
   computer.

   Therefore:

   - Refresh          -> data remains
   - Accidental reload -> data remains
   - Minimize browser -> data remains
   - Change tab       -> data remains
   - Close/reopen page -> data remains, provided browser
                          has not cleared site data
   - Successful Firebase submission -> draft is cleared
*/

const DRAFT_STORAGE_KEY =
    "apexProductionReport_currentDraft_v1";


let isRestoringDraft = false;


/* =====================================================
   CURRENT SHIFT ENTRIES
===================================================== */

let shiftEntries = [];


/* =====================================================
   DEFAULT DATE
===================================================== */

function getTodayString() {

    const today =
        new Date();

    return today.toISOString().split("T")[0];

}


/* =====================================================
   LOAD INITIAL DATE
===================================================== */

reportDate.value =
    getTodayString();


/* =====================================================
   GET CURRENT DYNAMIC FORM DATA
===================================================== */

function getCurrentMachineFormData() {

    const data = {

        process:
            process.value || "",

        machine:
            machine.value || "",

        status:
            "",

        remarks:
            "",

        fields: {}

    };


    const statusElement =
        document.getElementById("machineStatus");

    if (statusElement) {

        data.status =
            statusElement.value || "";

    }


    const remarksElement =
        document.getElementById("remarks");

    if (remarksElement) {

        data.remarks =
            remarksElement.value || "";

    }


    /*
       Save every currently existing input/select/
       textarea inside the dynamic machine form.

       This is important because process-specific
       fields are created dynamically.
    */

    const dynamicFields =
        machineForm.querySelectorAll(
            "input, select, textarea"
        );


    dynamicFields.forEach(
        function (element) {

            if (!element.id) {
                return;
            }

            /*
               Do not separately store machineStatus and
               remarks here because they are already stored
               above.
            */

            if (
                element.id === "machineStatus" ||
                element.id === "remarks"
            ) {
                return;
            }


            data.fields[element.id] =
                element.value;

        }
    );


    return data;

}


/* =====================================================
   BUILD COMPLETE DRAFT OBJECT
===================================================== */

function getDraftData() {

    return {

        version: 1,

        savedAt:
            Date.now(),

        reportDate:
            reportDate.value || "",

        shift:
            shift.value || "",

        unit:
            unit.value || "",

        supervisor:
            supervisor.value || "",

        currentMachineForm:
            getCurrentMachineFormData(),

        shiftEntries:
            shiftEntries

    };

}


/* =====================================================
   SAVE DRAFT
===================================================== */

function saveDraft() {

    if (isRestoringDraft) {
        return;
    }


    try {

        const draft =
            getDraftData();


        localStorage.setItem(
            DRAFT_STORAGE_KEY,
            JSON.stringify(draft)
        );

    }

    catch (error) {

        console.error(
            "Could not save production report draft:",
            error
        );

    }

}


/* =====================================================
   LOAD DRAFT FROM LOCAL STORAGE
===================================================== */

function loadDraft() {

    try {

        const saved =
            localStorage.getItem(
                DRAFT_STORAGE_KEY
            );


        if (!saved) {
            return null;
        }


        const draft =
            JSON.parse(saved);


        if (!draft || typeof draft !== "object") {
            return null;
        }


        return draft;

    }

    catch (error) {

        console.error(
            "Could not load production report draft:",
            error
        );

        return null;

    }

}


/* =====================================================
   CLEAR DRAFT
===================================================== */

function clearDraft() {

    try {

        localStorage.removeItem(
            DRAFT_STORAGE_KEY
        );

    }

    catch (error) {

        console.error(
            "Could not clear production report draft:",
            error
        );

    }

}


/* =====================================================
   POPULATE PROCESS OPTIONS
===================================================== */

function populateProcessOptions(
    selectedProcess = ""
) {

    process.innerHTML =
        '<option value="">Select Process</option>';


    if (!unit.value) {
        return;
    }


    const processes =
        machineData[unit.value];


    if (!processes) {
        return;
    }


    Object.keys(processes).forEach(
        function (processName) {

            const machines =
                processes[processName];


            if (machines.length > 0) {

                const option =
                    document.createElement("option");


                option.value =
                    processName;


                option.textContent =
                    processName;


                process.appendChild(
                    option
                );

            }

        }
    );


    if (selectedProcess) {

        const exists =
            Array.from(
                process.options
            ).some(
                option =>
                    option.value === selectedProcess
            );


        if (exists) {

            process.value =
                selectedProcess;

        }

    }

}


/* =====================================================
   POPULATE MACHINE OPTIONS
===================================================== */

function populateMachineOptions(
    selectedMachine = ""
) {

    machine.innerHTML =
        '<option value="">Select Machine</option>';


    if (
        !unit.value ||
        !process.value
    ) {

        return;

    }


    const machines =
        machineData[
            unit.value
        ]?.[
            process.value
        ] || [];


    machines.forEach(
        function (machineName) {

            const option =
                document.createElement("option");


            option.value =
                machineName;


            option.textContent =
                machineName;


            machine.appendChild(
                option
            );

        }
    );


    if (selectedMachine) {

        const exists =
            Array.from(
                machine.options
            ).some(
                option =>
                    option.value === selectedMachine
            );


        if (exists) {

            machine.value =
                selectedMachine;

        }

    }

}


/* =====================================================
   UNIT CHANGE
===================================================== */

unit.addEventListener(
    "change",
    function () {

        process.innerHTML =
            '<option value="">Select Process</option>';


        machine.innerHTML =
            '<option value="">Select Machine</option>';


        machineForm.innerHTML =
            '<p class="empty-message">' +
            'Select a process and machine to enter production data.' +
            '</p>';


        if (!unit.value) {

            saveDraft();

            return;

        }


        populateProcessOptions();


        saveDraft();

    }
);


/* =====================================================
   PROCESS CHANGE
===================================================== */

process.addEventListener(
    "change",
    function () {

        machine.innerHTML =
            '<option value="">Select Machine</option>';


        machineForm.innerHTML =
            '<p class="empty-message">' +
            'Select a machine to enter production data.' +
            '</p>';


        if (
            !unit.value ||
            !process.value
        ) {

            saveDraft();

            return;

        }


        populateMachineOptions();


        saveDraft();

    }
);


/* =====================================================
   MACHINE CHANGE
===================================================== */

machine.addEventListener(
    "change",
    function () {

        createMachineForm();

        saveDraft();

    }
);


/* =====================================================
   CREATE MACHINE FORM
===================================================== */

function createMachineForm() {

    machineForm.innerHTML = "";


    if (!machine.value) {

        machineForm.innerHTML =
            '<p class="empty-message">' +
            'Select a machine to enter production data.' +
            '</p>';

        return;

    }


    const wrapper =
        document.createElement("div");

    wrapper.className =
        "machine-entry-form";


    /* =================================================
       STATUS
    ================================================= */

    const statusGroup =
        document.createElement("div");

    statusGroup.className =
        "form-group";


    statusGroup.innerHTML = `

        <label>
            Machine Status
        </label>

        <select id="machineStatus">

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

    `;


    wrapper.appendChild(
        statusGroup
    );


    /* =================================================
       PROCESS-SPECIFIC FIELDS
    ================================================= */

    const fieldsContainer =
        document.createElement("div");


    fieldsContainer.id =
        "processFields";


    wrapper.appendChild(
        fieldsContainer
    );


    /* =================================================
       REMARKS
    ================================================= */

    const remarksGroup =
        document.createElement("div");


    remarksGroup.className =
        "form-group";


    remarksGroup.innerHTML = `

        <label>
            Remarks
        </label>

        <textarea
            id="remarks"
            rows="4"
            placeholder="Problems / observations / remarks"
        ></textarea>

    `;


    wrapper.appendChild(
        remarksGroup
    );


    machineForm.appendChild(
        wrapper
    );


    /* =================================================
       LOAD CORRECT FIELDS
    ================================================= */

    renderProcessFields();


    /* =================================================
       STATUS CHANGE
    ================================================= */

    document
        .getElementById("machineStatus")
        .addEventListener(
            "change",
            function () {

                /*
                   Save values before rebuilding fields.
                   This protects the current draft.
                */

                saveDraft();


                renderProcessFields();


                saveDraft();

            }
        );

}


/* =====================================================
   RENDER PROCESS FIELDS
===================================================== */

function renderProcessFields() {

    const container =
        document.getElementById(
            "processFields"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    const statusElement =
        document.getElementById(
            "machineStatus"
        );


    if (!statusElement) {
        return;
    }


    const status =
        statusElement.value;


    /*
       For Idle / Maintenance,
       production measurement fields
       are not necessary.
    */

    if (
        status === "Idle" ||
        status === "Maintenance"
    ) {

        container.innerHTML = `

            <p class="status-message">
                ${status} — no production
                measurement required.
            </p>

        `;

        return;

    }


    /* =================================================
       PRINTING
    ================================================= */

    if (
        process.value === "Printing"
    ) {

        container.innerHTML = `

            <div class="grid">

                <div class="form-group">

                    <label>
                        Total Printed Length (m)
                    </label>

                    <input
                        type="number"
                        id="length"
                        min="0"
                        placeholder="Enter length"
                    >

                </div>


                <div class="form-group">

                    <label>
                        Weight (kg)
                    </label>

                    <input
                        type="number"
                        id="weight"
                        min="0"
                        step="0.01"
                        placeholder="Enter weight"
                    >

                </div>


                <div class="form-group">

                    <label>
                        Speed
                    </label>

                    <input
                        type="number"
                        id="speed"
                        min="0"
                        placeholder="Enter speed"
                    >

                </div>

            </div>


            <div class="form-group">

                <label>
                    Product
                </label>

                <input
                    type="text"
                    id="product"
                    placeholder="Enter product"
                >

            </div>

        `;

    }


    /* =================================================
       LAMINATION
    ================================================= */

    else if (
        process.value === "Lamination"
    ) {

        container.innerHTML = `

            <div class="grid">

                <div class="form-group">

                    <label>
                        Total Laminated Length (m)
                    </label>

                    <input
                        type="number"
                        id="length"
                        min="0"
                        placeholder="Enter length"
                    >

                </div>


                <div class="form-group">

                    <label>
                        Weight (kg)
                    </label>

                    <input
                        type="number"
                        id="weight"
                        min="0"
                        step="0.01"
                        placeholder="Enter weight"
                    >

                </div>


                <div class="form-group">

                    <label>
                        Speed
                    </label>

                    <input
                        type="number"
                        id="speed"
                        min="0"
                        placeholder="Enter speed"
                    >

                </div>

            </div>


            <div class="form-group">

                <label>
                    Product
                </label>

                <input
                    type="text"
                    id="product"
                    placeholder="Enter product"
                >

            </div>

        `;

    }


    /* =================================================
       COLDSEAL
    ================================================= */

    else if (
        process.value === "ColdSeal"
    ) {

        container.innerHTML = `

            <div class="grid">

                <div class="form-group">

                    <label>
                        Total ColdSeal Length (m)
                    </label>

                    <input
                        type="number"
                        id="length"
                        min="0"
                        placeholder="Enter length"
                    >

                </div>


                <div class="form-group">

                    <label>
                        Weight (kg)
                    </label>

                    <input
                        type="number"
                        id="weight"
                        min="0"
                        step="0.01"
                        placeholder="Enter weight"
                    >

                </div>


                <div class="form-group">

                    <label>
                        Speed
                    </label>

                    <input
                        type="number"
                        id="speed"
                        min="0"
                        placeholder="Enter speed"
                    >

                </div>

            </div>


            <div class="form-group">

                <label>
                    Product
                </label>

                <input
                    type="text"
                    id="product"
                    placeholder="Enter product"
                >

            </div>

        `;

    }


    /* =================================================
       EXTRUSION COATING
    ================================================= */

    else if (
        process.value === "Extrusion Coating"
    ) {

        container.innerHTML = `

            <div class="grid">

                <div class="form-group">

                    <label>
                        Total Coated Length (m)
                    </label>

                    <input
                        type="number"
                        id="length"
                        min="0"
                        placeholder="Enter length"
                    >

                </div>


                <div class="form-group">

                    <label>
                        Weight (kg)
                    </label>

                    <input
                        type="number"
                        id="weight"
                        min="0"
                        step="0.01"
                        placeholder="Enter weight"
                    >

                </div>


                <div class="form-group">

                    <label>
                        Speed
                    </label>

                    <input
                        type="number"
                        id="speed"
                        min="0"
                        placeholder="Enter speed"
                    >

                </div>

            </div>


            <div class="form-group">

                <label>
                    Product
                </label>

                <input
                    type="text"
                    id="product"
                    placeholder="Enter product"
                >

            </div>

        `;

    }


    /* =================================================
       SLITTING
    ================================================= */

    else if (
        process.value === "Slitting"
    ) {

        container.innerHTML = `

            <div class="grid">

                <div class="form-group">

                    <label>
                        Total Slitted Length (m)
                    </label>

                    <input
                        type="number"
                        id="length"
                        min="0"
                        placeholder="Enter length"
                    >

                </div>


                <div class="form-group">

                    <label>
                        Weight (kg)
                    </label>

                    <input
                        type="number"
                        id="weight"
                        min="0"
                        step="0.01"
                        placeholder="Enter weight"
                    >

                </div>


                <div class="form-group">

                    <label>
                        Speed
                    </label>

                    <input
                        type="number"
                        id="speed"
                        min="0"
                        placeholder="Enter speed"
                    >

                </div>

            </div>


            <div class="form-group">

                <label>
                    Product
                </label>

                <input
                    type="text"
                    id="product"
                    placeholder="Enter product"
                >

            </div>

        `;

    }


    /* =================================================
       DOCTORING
    ================================================= */

    else if (
        process.value === "Doctoring"
    ) {

        container.innerHTML = `

            <div class="form-group">

                <label>
                    Total Coils
                </label>

                <input
                    type="number"
                    id="totalCoils"
                    min="0"
                    placeholder="Example: 13"
                >

            </div>


            <div class="form-group">

                <label>
                    Coil Details
                </label>

                <textarea
                    id="coilDetails"
                    rows="6"
                    placeholder="Example:
Munch 38.5 gm - 5 C
Munch 8.7 gm - 8 C"
                ></textarea>

            </div>

        `;

    }


    /* =================================================
       INSPECTION
    ================================================= */

    else if (
        process.value === "Inspection"
    ) {

        container.innerHTML = `

            <div class="grid">

                <div class="form-group">

                    <label>
                        Weight (kg)
                    </label>

                    <input
                        type="number"
                        id="weight"
                        min="0"
                        step="0.01"
                        placeholder="Enter weight"
                    >

                </div>


                <div class="form-group">

                    <label>
                        Job Name
                    </label>

                    <input
                        type="text"
                        id="jobName"
                        placeholder="Enter job name"
                    >

                </div>

            </div>

        `;

    }

}


/* =====================================================
   RESTORE DYNAMIC MACHINE FORM
===================================================== */

function restoreCurrentMachineForm(
    currentForm
) {

    if (!currentForm) {
        return;
    }


    if (
        !currentForm.process ||
        !currentForm.machine
    ) {
        return;
    }


    /*
       Restore process and machine selections.
    */

    process.value =
        currentForm.process;


    populateMachineOptions(
        currentForm.machine
    );


    if (
        machine.value !== currentForm.machine
    ) {

        return;

    }


    /*
       Build dynamic fields.
    */

    createMachineForm();


    /*
       Restore machine status.
    */

    const statusElement =
        document.getElementById(
            "machineStatus"
        );


    if (
        statusElement &&
        currentForm.status
    ) {

        statusElement.value =
            currentForm.status;


        /*
           Re-render because Idle/Maintenance have
           different fields.
        */

        renderProcessFields();

    }


    /*
       Restore process-specific values.
    */

    if (currentForm.fields) {

        Object.keys(
            currentForm.fields
        ).forEach(
            function (fieldId) {

                const element =
                    document.getElementById(
                        fieldId
                    );


                if (element) {

                    element.value =
                        currentForm.fields[fieldId];

                }

            }
        );

    }


    /*
       Restore remarks.
    */

    const remarksElement =
        document.getElementById("remarks");


    if (remarksElement) {

        remarksElement.value =
            currentForm.remarks || "";

    }

}


/* =====================================================
   RESTORE COMPLETE DRAFT
===================================================== */

function restoreDraft() {

    const draft =
        loadDraft();


    if (!draft) {
        return false;
    }


    /*
       Check whether draft actually contains
       meaningful information.
    */

    const hasData =
        Boolean(
            draft.reportDate ||
            draft.shift ||
            draft.unit ||
            draft.supervisor ||
            draft.currentMachineForm?.process ||
            draft.shiftEntries?.length
        );


    if (!hasData) {
        return false;
    }


    isRestoringDraft = true;


    try {

        /* ---------------------------------------------
           BASIC SHIFT INFORMATION
        --------------------------------------------- */

        if (draft.reportDate) {

            reportDate.value =
                draft.reportDate;

        }


        if (draft.shift) {

            shift.value =
                draft.shift;

        }


        if (draft.supervisor !== undefined) {

            supervisor.value =
                draft.supervisor;

        }


        /* ---------------------------------------------
           UNIT
        --------------------------------------------- */

        if (draft.unit) {

            unit.value =
                draft.unit;


            populateProcessOptions();

        }


        /* ---------------------------------------------
           ALREADY ADDED MACHINE REPORTS
        --------------------------------------------- */

        if (
            Array.isArray(
                draft.shiftEntries
            )
        ) {

            shiftEntries =
                draft.shiftEntries;

        }
        else {

            shiftEntries = [];

        }


        displayEntries();


        /* ---------------------------------------------
           CURRENT MACHINE FORM
        --------------------------------------------- */

        if (
            draft.currentMachineForm &&
            draft.currentMachineForm.process &&
            draft.currentMachineForm.machine
        ) {

            restoreCurrentMachineForm(
                draft.currentMachineForm
            );

        }
        else {

            machine.innerHTML =
                '<option value="">Select Machine</option>';


            machineForm.innerHTML =
                '<p class="empty-message">' +
                'Select a process and machine to enter production data.' +
                '</p>';

        }


    }

    finally {

        isRestoringDraft = false;

    }


    return true;

}


/* =====================================================
   ADD MACHINE TO CURRENT SHIFT
===================================================== */

saveMachineReport.addEventListener(
    "click",
    function () {

        if (!unit.value) {

            alert(
                "Please select Unit."
            );

            return;

        }


        if (!process.value) {

            alert(
                "Please select Process."
            );

            return;

        }


        if (!machine.value) {

            alert(
                "Please select Machine."
            );

            return;

        }


        const statusElement =
            document.getElementById(
                "machineStatus"
            );


        if (!statusElement) {

            alert(
                "Please select machine status."
            );

            return;

        }


        const status =
            statusElement.value;


        const entry = {

            unit:
                unit.value,

            process:
                process.value,

            machine:
                machine.value,

            status:
                status

        };


        /* =================================================
           PROCESS-SPECIFIC DATA
        ================================================= */

        if (
            process.value === "Printing" ||
            process.value === "Lamination" ||
            process.value === "ColdSeal" ||
            process.value === "Slitting" ||
            process.value === "Extrusion Coating"
        ) {

            entry.length =
                getValue("length");

            entry.weight =
                getValue("weight");

            entry.speed =
                getValue("speed");

            entry.product =
                getValue("product");

        }


        if (
            process.value === "Doctoring"
        ) {

            entry.totalCoils =
                getValue("totalCoils");

            entry.coilDetails =
                getValue("coilDetails");

        }


        if (
            process.value === "Inspection"
        ) {

            entry.weight =
                getValue("weight");

            entry.jobName =
                getValue("jobName");

        }


        entry.remarks =
            getValue("remarks");


        /* =================================================
           ADD ENTRY
        ================================================= */

        shiftEntries.push(
            entry
        );


        displayEntries();


        /*
           IMPORTANT:
           Save immediately after adding the machine.

           Therefore, even if the page refreshes after
           this point, the machine entry is not lost.
        */

        saveDraft();


        /* =================================================
           RESET CURRENT MACHINE SELECTION
        ================================================= */

        machine.value = "";


        machineForm.innerHTML =
            '<p class="empty-message">' +
            'Machine added. Select another machine if required.' +
            '</p>';


        /*
           Save again because current machine selection
           has intentionally been cleared.
        */

        saveDraft();

    }
);


/* =====================================================
   GET INPUT VALUE
===================================================== */

function getValue(id) {

    const element =
        document.getElementById(id);


    if (!element) {
        return "";
    }


    return element.value.trim();

}


/* =====================================================
   DISPLAY CURRENT ENTRIES
===================================================== */

function displayEntries() {

    entries.innerHTML = "";


    if (
        shiftEntries.length === 0
    ) {

        entries.innerHTML =
            '<p class="empty-message">' +
            'No machines added yet.' +
            '</p>';

        return;

    }


    shiftEntries.forEach(
        function (item, index) {

            const card =
                document.createElement("div");


            card.className =
                "entry-card";


            let details = "";


            if (item.length) {

                details +=
                    `<span>
                        Length: ${formatText(String(item.length))} m
                    </span>`;

            }


            if (item.weight) {

                details +=
                    `<span>
                        Weight: ${formatText(String(item.weight))} kg
                    </span>`;

            }


            if (item.speed) {

                details +=
                    `<span>
                        Speed: ${formatText(String(item.speed))}
                    </span>`;

            }


            if (item.product) {

                details +=
                    `<span>
                        Product: ${formatText(String(item.product))}
                    </span>`;

            }


            if (item.totalCoils) {

                details +=
                    `<span>
                        Total Coils: ${formatText(String(item.totalCoils))} C
                    </span>`;

            }


            if (item.coilDetails) {

                details +=
                    `<span>
                        Coil Details:<br>
                        ${formatText(String(item.coilDetails))}
                    </span>`;

            }


            if (item.jobName) {

                details +=
                    `<span>
                        Job Name: ${formatText(String(item.jobName))}
                    </span>`;

            }


            if (item.remarks) {

                details +=
                    `<span>
                        Remarks: ${formatText(String(item.remarks))}
                    </span>`;

            }


            card.innerHTML = `

                <div class="entry-header">

                    <strong>
                        ${formatText(String(item.machine || ""))}
                    </strong>

                    <button
                        type="button"
                        class="delete-button"
                        data-index="${index}"
                    >
                        Remove
                    </button>

                </div>


                <div class="entry-details">

                    <span>
                        Process:
                        ${formatText(String(item.process || ""))}
                    </span>

                    <span>
                        Status:
                        ${formatText(String(item.status || ""))}
                    </span>

                    ${details}

                </div>

            `;


            entries.appendChild(
                card
            );

        }
    );


    document
        .querySelectorAll(".delete-button")
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const index =
                            Number(
                                button.dataset.index
                            );


                        shiftEntries.splice(
                            index,
                            1
                        );


                        displayEntries();


                        /*
                           IMPORTANT:
                           Removing a machine is an intentional
                           user action, so update the persistent
                           draft immediately.
                        */

                        saveDraft();

                    }
                );

            }
        );

}


/* =====================================================
   FORMAT TEXT
===================================================== */

function formatText(text) {

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>");

}


/* =====================================================
   AUTOMATIC FIELD SAVE
===================================================== */

/*
   This is the main protection against data loss.

   "input" catches:
   - typing
   - deleting
   - textarea entry
   - number changes

   "change" catches:
   - select changes
   - date changes
   - other committed input changes

   Because the events bubble, this also works for
   dynamically-created process fields.
*/

document.addEventListener(
    "input",
    function (event) {

        if (isRestoringDraft) {
            return;
        }


        const target =
            event.target;


        if (
            target.matches(
                "#reportDate, #shift, #unit, #supervisor, #process, #machine, #machineForm input, #machineForm select, #machineForm textarea"
            )
        ) {

            saveDraft();

        }

    }
);


document.addEventListener(
    "change",
    function (event) {

        if (isRestoringDraft) {
            return;
        }


        const target =
            event.target;


        if (
            target.matches(
                "#reportDate, #shift, #unit, #supervisor, #process, #machine, #machineForm input, #machineForm select, #machineForm textarea"
            )
        ) {

            /*
               Allow the existing change handler to finish
               rebuilding dynamic fields first.
            */

            setTimeout(
                function () {

                    saveDraft();

                },
                0
            );

        }

    }
);


/* =====================================================
   PAGE VISIBILITY PROTECTION
===================================================== */

/*
   Save when the user changes browser tab, minimizes the
   browser, or the page becomes hidden.
*/

document.addEventListener(
    "visibilitychange",
    function () {

        if (
            document.visibilityState === "hidden"
        ) {

            saveDraft();

        }

    }
);


/* =====================================================
   PAGE HIDE PROTECTION
===================================================== */

/*
   This gives another opportunity to save the draft
   before the browser unloads or navigates away.
*/

window.addEventListener(
    "pagehide",
    function () {

        saveDraft();

    }
);


/* =====================================================
   BEFORE UNLOAD PROTECTION
===================================================== */

window.addEventListener(
    "beforeunload",
    function () {

        saveDraft();

    }
);


/* =====================================================
   SUBMIT COMPLETE SHIFT REPORT
===================================================== */

submitShiftReport.addEventListener(
    "click",
    async function () {

        if (!reportDate.value) {

            alert(
                "Please select Production Date."
            );

            return;

        }


        if (!shift.value) {

            alert(
                "Please select Shift."
            );

            return;

        }


        if (!unit.value) {

            alert(
                "Please select Unit."
            );

            return;

        }


        if (!supervisor.value.trim()) {

            alert(
                "Please enter Supervisor Name."
            );

            return;

        }


        if (
            shiftEntries.length === 0
        ) {

            alert(
                "Please add at least one machine report."
            );

            return;

        }


        const completeReport = {

            productionDate:
                reportDate.value,

            shift:
                shift.value,

            unit:
                unit.value,

            supervisor:
                supervisor.value.trim(),

            machines:
                shiftEntries,

            entryTimestamp:
                serverTimestamp()

        };


        try {

            /*
               Save one final draft before attempting
               Firebase submission.

               If Firebase fails, the entered data is
               still available in localStorage.
            */

            saveDraft();


            const reportsRef =
                ref(
                    database,
                    "productionReports"
                );


            await push(
                reportsRef,
                completeReport
            );


            alert(
                "Shift report submitted successfully!"
            );


            /*
               IMPORTANT:
               Firebase submission succeeded.

               Now and ONLY now remove the local draft.
            */

            clearDraft();


            /*
               Reset current report.
            */

            shiftEntries = [];


            displayEntries();


            machineForm.innerHTML =
                '<p class="empty-message">' +
                'Shift report submitted. You can start a new report.' +
                '</p>';


            machine.innerHTML =
                '<option value="">Select Machine</option>';


            /*
               Keep the existing basic shift information
               behavior, but reset machine/process selection.
            */

            process.innerHTML =
                '<option value="">Select Process</option>';


            /*
               The report date is intentionally left as-is,
               as in the existing application.
            */

        }

        catch (error) {

            console.error(
                "Firebase save error:",
                error
            );


            /*
               IMPORTANT:
               DO NOT clear the draft here.

               If internet/Firebase fails, all entered
               information remains recoverable.
            */

            saveDraft();


            alert(
                "Could not submit report. Please check your internet connection. Your entered data has been saved and will remain available."
            );

        }

    }
);


/* =====================================================
   INITIALIZE APPLICATION
===================================================== */

function initializeApplication() {

    const draft =
        loadDraft();


    if (draft) {

        const restored =
            restoreDraft();


        if (restored) {

            console.log(
                "Previous production report draft restored."
            );

            return;

        }

    }


    /*
       No existing draft.

       Start with today's date.
    */

    reportDate.value =
        getTodayString();


    /*
       Initial empty state.
    */

    machine.innerHTML =
        '<option value="">Select Machine</option>';


    process.innerHTML =
        '<option value="">Select Process</option>';


    machineForm.innerHTML =
        '<p class="empty-message">' +
        'Select a process and machine to enter production data.' +
        '</p>';


    entries.innerHTML =
        '<p class="empty-message">' +
        'No machines added yet.' +
        '</p>';

}


/* =====================================================
   START APPLICATION
===================================================== */

initializeApplication();
