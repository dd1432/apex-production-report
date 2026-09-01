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
  apiKey: "AIzaSyBVdV7BKtw1lBexUBSM90l2gRmg2vNE7RY",
  authDomain: "apex-production-report-90e12.firebaseapp.com",
  databaseURL: "https://apex-production-report-90e12-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "apex-production-report-90e12",
  storageBucket: "apex-production-report-90e12.firebasestorage.app",
  messagingSenderId: "857344599590",
  appId: "1:857344599590:web:d002e55d68d896afe0e8e7"
};

/* =====================================================
   INITIALIZE FIREBASE
===================================================== */

const firebaseApp =
    initializeApp(firebaseConfig);

const database =
    getDatabase(firebaseApp);

/* =====================================================
   APEX PRODUCTION REPORT
   APP.JS
===================================================== */


/* =====================================================
   MACHINE STRUCTURE
===================================================== */

const machines = {

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

        "Extrusion Lamination": [
            "Extrusion Lamination 1"
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

        "Extrusion Lamination": []
    }

};


/* =====================================================
   GET HTML ELEMENTS
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

const shiftHelp =
    document.getElementById("shiftHelp");

const machine =
    document.getElementById("machine");

const machineForm =
    document.getElementById("machineForm");

const entriesList =
    document.getElementById("entriesList");


/* =====================================================
   SET DEFAULT PRODUCTION DATE
===================================================== */

/*
   Today's date is used only as a convenient default.

   IMPORTANT:
   The supervisor can change the Production Date
   to any required date.

   This is necessary because the 3rd Shift is entered
   on the following calendar day but belongs to the
   previous Production Date.
*/

const today = new Date();

const todayString =
    today.toISOString().split("T")[0];

reportDate.value = todayString;

/* =====================================================
   SHIFT CHANGE
===================================================== */

shift.addEventListener(
    "change",
    function () {

        if (shift.value === "3rd") {

            shiftHelp.textContent =
                "⚠️ 3rd Shift is from 00:00 to 08:00 of the next calendar day. Enter the correct Production Date.";

        } else {

            shiftHelp.textContent = "";

        }

    }
);

/* =====================================================
   UNIT CHANGE
===================================================== */

unit.addEventListener(
    "change",
    function () {

        /* Reset process */

        process.value = "";


        /* Reset machine */

        machine.innerHTML = `
            <option value="">
                Select Process First
            </option>
        `;


        /* Remove machine form */

        machineForm.innerHTML = "";

    }
);


/* =====================================================
   PROCESS CHANGE
===================================================== */

process.addEventListener(
    "change",
    function () {

        /* Clear machine list */

        machine.innerHTML = `
            <option value="">
                Select Machine
            </option>
        `;


        /* Clear previous form */

        machineForm.innerHTML = "";


        const selectedUnit =
            unit.value;

        const selectedProcess =
            process.value;


        /* Check selection */

        if (
            !selectedUnit ||
            !selectedProcess
        ) {

            machine.innerHTML = `
                <option value="">
                    Select Unit and Process
                </option>
            `;

            return;
        }


        /* Get machines */

        const availableMachines =
            machines[
                selectedUnit
            ][
                selectedProcess
            ];


        /* No machines */

        if (
            !availableMachines ||
            availableMachines.length === 0
        ) {

            machine.innerHTML = `
                <option value="">
                    No machine available
                </option>
            `;

            return;
        }


        /* Add machines */

        availableMachines.forEach(
            function (machineName) {

                const option =
                    document.createElement(
                        "option"
                    );

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

        const selectedProcess =
            process.value;

        const selectedMachine =
            machine.value;


        if (!selectedMachine) {

            machineForm.innerHTML = "";

            return;
        }


        createMachineForm(
            selectedProcess,
            selectedMachine
        );

    }
);


/* =====================================================
   CREATE MACHINE FORM
===================================================== */

function createMachineForm(
    selectedProcess,
    selectedMachine
) {

    let form = `

        <h3>
            ${selectedMachine}
        </h3>

    `;


    /* =================================================
       PRINTING
    ================================================= */

    if (
        selectedProcess ===
        "Printing"
    ) {

        form += `

            <div class="form-group">

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

                    <option value="Breakdown">
                        Breakdown
                    </option>

                    <option value="Maintenance">
                        Maintenance
                    </option>

                </select>

            </div>


            <div class="form-group">

                <label>
                    Total Printed Length (metres)
                </label>

                <input
                    type="number"
                    id="length"
                    placeholder="Example: 12000"
                >

            </div>


            <div class="form-group">

                <label>
                    Weight (kg)
                </label>

                <input
                    type="number"
                    id="weight"
                    placeholder="Example: 717"
                >

            </div>


            <div class="form-group">

                <label>
                    Speed (m/min)
                </label>

                <input
                    type="number"
                    id="speed"
                    placeholder="Optional"
                >

            </div>


            <div class="form-group">

                <label>
                    Product
                </label>

                <input
                    type="text"
                    id="product"
                    placeholder="Example: Parle G 800 gm"
                >

            </div>


            <div class="form-group">

                <label>
                    Remarks
                </label>

                <textarea
                    id="remarks"
                    placeholder="Blocking problem, speed reduced, etc."
                ></textarea>

            </div>

        `;

    }


    /* =================================================
       LAMINATION
    ================================================= */

    else if (
        selectedProcess ===
        "Lamination"
    ) {

        form += `

            <div class="form-group">

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

                    <option value="Breakdown">
                        Breakdown
                    </option>

                    <option value="Maintenance">
                        Maintenance
                    </option>

                </select>

            </div>


            <div class="form-group">

                <label>
                    Total Laminated Length (metres)
                </label>

                <input
                    type="number"
                    id="length"
                    placeholder="Example: 56389"
                >

            </div>


            <div class="form-group">

                <label>
                    Weight (kg)
                </label>

                <input
                    type="number"
                    id="weight"
                    placeholder="Optional"
                >

            </div>


            <div class="form-group">

                <label>
                    Product
                </label>

                <input
                    type="text"
                    id="product"
                    placeholder="Product name"
                >

            </div>


            <div class="form-group">

                <label>
                    Remarks
                </label>

                <textarea
                    id="remarks"
                    placeholder="Problems / remarks"
                ></textarea>

            </div>

        `;

    }


    /* =================================================
       SLITTING
    ================================================= */

    else if (
        selectedProcess ===
        "Slitting"
    ) {

        form += `

            <div class="form-group">

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

                    <option value="Breakdown">
                        Breakdown
                    </option>

                    <option value="Maintenance">
                        Maintenance
                    </option>

                </select>

            </div>


            <div class="form-group">

                <label>
                    Total Slitted Length (metres)
                </label>

                <input
                    type="number"
                    id="length"
                    placeholder="Optional"
                >

            </div>


            <div class="form-group">

                <label>
                    Weight (kg)
                </label>

                <input
                    type="number"
                    id="weight"
                    placeholder="Example: 2452"
                >

            </div>


            <div class="form-group">

                <label>
                    Product
                </label>

                <input
                    type="text"
                    id="product"
                    placeholder="Product name"
                >

            </div>


            <div class="form-group">

                <label>
                    Remarks
                </label>

                <textarea
                    id="remarks"
                    placeholder="Improper winding, adhesive problem, etc."
                ></textarea>

            </div>

        `;

    }


    /* =================================================
       DOCTORING
    ================================================= */

    else if (
        selectedProcess ===
        "Doctoring"
    ) {

        form += `

            <div class="form-group">

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

                    <option value="Breakdown">
                        Breakdown
                    </option>

                    <option value="Maintenance">
                        Maintenance
                    </option>

                </select>

            </div>


            <div class="form-group">

                <label>
                    Total Coils
                </label>

                <input
                    type="number"
                    id="totalCoils"
                    placeholder="Example: 13"
                >

            </div>


            <div class="form-group">

                <label>
                    Product / Coil Details
                </label>

                <textarea
                    id="coilDetails"
                    placeholder="Example:
Munch 38.5 gm - 5 C
Munch 8.7 gm - 8 C"
                ></textarea>

            </div>


            <div class="form-group">

                <label>
                    Remarks
                </label>

                <textarea
                    id="remarks"
                    placeholder="Problems / remarks"
                ></textarea>

            </div>

        `;

    }


    /* =================================================
       INSPECTION
    ================================================= */

    else if (
        selectedProcess ===
        "Inspection"
    ) {

        form += `

            <div class="form-group">

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

                    <option value="Breakdown">
                        Breakdown
                    </option>

                    <option value="Maintenance">
                        Maintenance
                    </option>

                </select>

            </div>


            <div class="form-group">

                <label>
                    Quantity
                </label>

                <input
                    type="number"
                    id="quantity"
                    placeholder="Enter quantity"
                >

            </div>


            <div class="form-group">

                <label>
                    Quantity Unit
                </label>

                <select id="quantityUnit">

                    <option value="metres">
                        Metres
                    </option>

                    <option value="kg">
                        Kg
                    </option>

                    <option value="coils">
                        Coils
                    </option>

                </select>

            </div>


            <div class="form-group">

                <label>
                    Remarks
                </label>

                <textarea
                    id="remarks"
                    placeholder="Inspection remarks"
                ></textarea>

            </div>

        `;

    }


    /* =================================================
       EXTRUSION LAMINATION
    ================================================= */

    else if (
        selectedProcess ===
        "Extrusion Lamination"
    ) {

        form += `

            <div class="form-group">

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

                    <option value="Breakdown">
                        Breakdown
                    </option>

                    <option value="Maintenance">
                        Maintenance
                    </option>

                </select>

            </div>


            <div class="form-group">

                <label>
                    Total Production Length (metres)
                </label>

                <input
                    type="number"
                    id="length"
                    placeholder="Optional"
                >

            </div>


            <div class="form-group">

                <label>
                    Weight (kg)
                </label>

                <input
                    type="number"
                    id="weight"
                    placeholder="Optional"
                >

            </div>


            <div class="form-group">

                <label>
                    Product
                </label>

                <input
                    type="text"
                    id="product"
                    placeholder="Product name"
                >

            </div>


            <div class="form-group">

                <label>
                    Remarks
                </label>

                <textarea
                    id="remarks"
                    placeholder="Problems / remarks"
                ></textarea>

            </div>

        `;

    }


    /* =================================================
       SAVE BUTTON
    ================================================= */

    form += `

        <button
            type="button"
            class="save-button"
            id="saveButton"
        >

            SAVE MACHINE REPORT

        </button>

    `;


    machineForm.innerHTML =
        form;


    /* Attach save button */

    document
        .getElementById("saveButton")
        .addEventListener(
            "click",
            saveMachineReport
        );

}


/* =====================================================
   SAVE MACHINE REPORT
===================================================== */

function saveMachineReport() {

    const dateValue =
        reportDate.value;

    const shiftValue =
        shift.value;

    const unitValue =
        unit.value;

    const supervisorValue =
        supervisor.value.trim();

    const processValue =
        process.value;

    const machineValue =
        machine.value;


    /* Check basic information */

    if (
        !dateValue ||
        !shiftValue ||
        !unitValue ||
        !supervisorValue ||
        !processValue ||
        !machineValue
    ) {

        alert(
            "Please complete Date, Shift, Unit, Supervisor, Process and Machine."
        );

        return;
    }


    /* Collect machine information */

    const report = {

        date:
            dateValue,

        shift:
            shiftValue,

        unit:
            unitValue,

        supervisor:
            supervisorValue,

        process:
            processValue,

        machine:
            machineValue,

        status:
            document
                .getElementById("machineStatus")
                ?.value || "",

        length:
            document
                .getElementById("length")
                ?.value || "",

        weight:
            document
                .getElementById("weight")
                ?.value || "",

        speed:
            document
                .getElementById("speed")
                ?.value || "",

        product:
            document
                .getElementById("product")
                ?.value || "",

        totalCoils:
            document
                .getElementById("totalCoils")
                ?.value || "",

        coilDetails:
            document
                .getElementById("coilDetails")
                ?.value || "",

        quantity:
            document
                .getElementById("quantity")
                ?.value || "",

        quantityUnit:
            document
                .getElementById("quantityUnit")
                ?.value || "",

        remarks:
            document
                .getElementById("remarks")
                ?.value || "",

        createdAt:
            new Date().toISOString()

    };


   /* =================================================
   SAVE TO FIREBASE
================================================= */

const reportsRef =
    ref(database, "productionReports");


push(
    reportsRef,
    {
        ...report,

        entryTimestamp:
            serverTimestamp()
    }
)
.then(function () {

    /* Show on screen */

    addEntryToScreen(
        report
    );


    /* Clear machine form */

    machineForm.innerHTML = "";


    /* Reset machine */

    machine.value = "";


    alert(
        machineValue +
        " report saved successfully."
    );

})
.catch(function (error) {

    console.error(
        "Firebase save error:",
        error
    );

    alert(
        "Could not save the report. Please try again."
    );

});

}


/* =====================================================
   DISPLAY ENTRY
===================================================== */

function addEntryToScreen(
    report
) {


    /* Remove empty message */

    const emptyMessage =
        entriesList
            .querySelector(
                ".empty-message"
            );


    if (emptyMessage) {

        emptyMessage.remove();

    }


    /* Create entry */

    const entry =
        document.createElement(
            "div"
        );


    entry.className =
        "entry";


    /* Build information */

    let details = `

        <strong>Process:</strong>
        ${report.process}
        <br>

        <strong>Status:</strong>
        ${report.status || "Not entered"}
        <br>

    `;


    if (report.length) {

        details += `

            <strong>Length:</strong>
            ${report.length} m
            <br>

        `;

    }


    if (report.weight) {

        details += `

            <strong>Weight:</strong>
            ${report.weight} kg
            <br>

        `;

    }


    if (report.speed) {

        details += `

            <strong>Speed:</strong>
            ${report.speed} m/min
            <br>

        `;

    }


    if (report.totalCoils) {

        details += `

            <strong>Total Coils:</strong>
            ${report.totalCoils}
            <br>

        `;

    }


    if (report.coilDetails) {

        details += `

            <strong>Coil Details:</strong>
            <br>

            ${report.coilDetails
                .replace(/\n/g, "<br>")}

            <br>

        `;

    }


    if (report.quantity) {

        details += `

            <strong>Quantity:</strong>
            ${report.quantity}
            ${report.quantityUnit}
            <br>

        `;

    }


    if (report.product) {

        details += `

            <strong>Product:</strong>
            ${report.product}
            <br>

        `;

    }


    if (report.remarks) {

        details += `

            <strong>Remarks:</strong>
            ${report.remarks
                .replace(/\n/g, "<br>")}

        `;

    }


    entry.innerHTML = `

        <div class="entry-title">

            ${report.machine}

        </div>

        <div class="entry-details">

            ${details}

        </div>

    `;


    entriesList.appendChild(
        entry
    );

}
