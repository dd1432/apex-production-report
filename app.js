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
  apiKey: "AIzaSyBVdV7BKtw1lBexUBSM90l2gRmg2vNE7RY",
  authDomain: "apex-production-report-90e12.firebaseapp.com",
  databaseURL: "https://apex-production-report-90e12-default-rtdb.asia-southeast1.firebasedatabase.app/",
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
   VARIABLES
===================================================== */

let shiftEntries = [];



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

                if (
                    processes[processName].length > 0
                ) {

                    const option =
                        document.createElement("option");

                    option.value =
                        processName;

                    option.textContent =
                        processName;

                    process.appendChild(option);

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
            machineData[unit.value][process.value];

        machines.forEach(
            function (machineName) {

                const option =
                    document.createElement("option");

                option.value =
                    machineName;

                option.textContent =
                    machineName;

                machine.appendChild(option);

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


    /* STATUS */

    wrapper.innerHTML = `

        <div class="grid">

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

                    <option value="Maintenance">
                        Maintenance
                    </option>

                </select>

            </div>


            <div class="form-group">

                <label>
                    Length (mtrs)
                </label>

                <input
                    type="number"
                    id="length"
                    placeholder="Enter length"
                    min="0"
                >

            </div>


            <div class="form-group">

                <label>
                    Weight (kg)
                </label>

                <input
                    type="number"
                    id="weight"
                    placeholder="Enter weight"
                    min="0"
                    step="0.01"
                >

            </div>


            <div class="form-group">

                <label>
                    Speed
                </label>

                <input
                    type="number"
                    id="speed"
                    placeholder="Enter speed"
                    min="0"
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


        <div class="form-group">

            <label>
                Remarks
            </label>

            <textarea
                id="remarks"
                placeholder="Enter remarks / problems / observations"
                rows="4"
            ></textarea>

        </div>

    `;


    machineForm.appendChild(
        wrapper
    );

}



/* =====================================================
   ADD MACHINE
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


        const length =
            document.getElementById(
                "length"
            ).value;


        const weight =
            document.getElementById(
                "weight"
            ).value;


        const speed =
            document.getElementById(
                "speed"
            ).value;


        const product =
            document.getElementById(
                "product"
            ).value;


        const remarks =
            document.getElementById(
                "remarks"
            ).value;


        const machineEntry = {

            unit:
                unit.value,

            process:
                process.value,

            machine:
                machine.value,

            status:
                status,

            length:
                length,

            weight:
                weight,

            speed:
                speed,

            product:
                product,

            remarks:
                remarks

        };


        shiftEntries.push(
            machineEntry
        );


        displayEntries();


        /* Reset machine selection */

        machine.value = "";

        machineForm.innerHTML =
            '<p class="empty-message">' +
            'Machine added. Select another machine if required.' +
            '</p>';

    }
);



/* =====================================================
   DISPLAY ENTRIES
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

                    ${
                        item.length
                        ?
                        `<span>
                            Length:
                            ${item.length} m
                         </span>`
                        :
                        ""
                    }

                    ${
                        item.weight
                        ?
                        `<span>
                            Weight:
                            ${item.weight} kg
                         </span>`
                        :
                        ""
                    }

                    ${
                        item.speed
                        ?
                        `<span>
                            Speed:
                            ${item.speed}
                         </span>`
                        :
                        ""
                    }

                    ${
                        item.product
                        ?
                        `<span>
                            Product:
                            ${item.product}
                         </span>`
                        :
                        ""
                    }

                    ${
                        item.remarks
                        ?
                        `<span>
                            Remarks:
                            ${item.remarks}
                         </span>`
                        :
                        ""
                    }

                </div>

            `;


            entries.appendChild(
                card
            );

        }
    );


    /* Delete buttons */

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
                "Firebase error:",
                error
            );


            alert(
                "Could not submit report. Please check your internet connection."
            );

        }

    }
);
