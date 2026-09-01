/* =====================================================
   APEX PRODUCTION REPORT
   SHIFT REPORT SYSTEM
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
    push,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";


/* =====================================================
   FIREBASE CONFIGURATION
===================================================== */

const firebaseConfig = {

    apiKey: "YOUR_REAL_API_KEY",

    authDomain: "YOUR_REAL_AUTH_DOMAIN",

    databaseURL:
        "https://apex-production-report-90e12-default-rtdb.asia-southeast1.firebasedatabase.app/",

    projectId: "YOUR_REAL_PROJECT_ID",

    storageBucket: "YOUR_REAL_STORAGE_BUCKET",

    messagingSenderId:
        "YOUR_REAL_MESSAGING_SENDER_ID",

    appId: "YOUR_REAL_APP_ID"

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
   CURRENT SHIFT ENTRIES
===================================================== */

let shiftEntries = [];



/* =====================================================
   DEFAULT DATE
===================================================== */

const today =
    new Date();

const todayString =
    today.toISOString().split("T")[0];

reportDate.value =
    todayString;



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
            return;
        }


        const processes =
            machineData[unit.value];


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
            return;
        }


        const machines =
            machineData[
                unit.value
            ][
                process.value
            ];


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

    }
);



/* =====================================================
   MACHINE CHANGE
===================================================== */

machine.addEventListener(
    "change",
    function () {

        createMachineForm();

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

                renderProcessFields();

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


    const status =
        document.getElementById(
            "machineStatus"
        ).value;


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


        const status =
            document.getElementById(
                "machineStatus"
            ).value;


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


        /* Reset selection */

        machine.value = "";

        machineForm.innerHTML =
            '<p class="empty-message">' +
            'Machine added. Select another machine if required.' +
            '</p>';

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
                        Length: ${item.length} m
                    </span>`;

            }


            if (item.weight) {

                details +=
                    `<span>
                        Weight: ${item.weight} kg
                    </span>`;

            }


            if (item.speed) {

                details +=
                    `<span>
                        Speed: ${item.speed}
                    </span>`;

            }


            if (item.product) {

                details +=
                    `<span>
                        Product: ${item.product}
                    </span>`;

            }


            if (item.totalCoils) {

                details +=
                    `<span>
                        Total Coils: ${item.totalCoils} C
                    </span>`;

            }


            if (item.coilDetails) {

                details +=
                    `<span>
                        Coil Details:<br>
                        ${formatText(item.coilDetails)}
                    </span>`;

            }


            if (item.jobName) {

                details +=
                    `<span>
                        Job Name: ${formatText(item.jobName)}
                    </span>`;

            }


            if (item.remarks) {

                details +=
                    `<span>
                        Remarks: ${formatText(item.remarks)}
                    </span>`;

            }


            card.innerHTML = `

                <div class="entry-header">

                    <strong>
                        ${item.machine}
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
                        ${item.process}
                    </span>

                    <span>
                        Status:
                        ${item.status}
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

                    }
                );

            }
        );

}



/* =====================================================
   FORMAT TEXT
===================================================== */

function formatText(text) {

    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>");

}



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


            /* Reset */

            shiftEntries = [];

            displayEntries();


            machineForm.innerHTML =
                '<p class="empty-message">' +
                'Shift report submitted. You can start a new report.' +
                '</p>';


            machine.innerHTML =
                '<option value="">Select Machine</option>';


        }

        catch (error) {


            console.error(
                "Firebase save error:",
                error
            );


            alert(
                "Could not submit report. Please check your internet connection."
            );

        }

    }
);
