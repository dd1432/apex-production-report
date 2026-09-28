// Firebase initialization using existing project config
const firebaseConfig = {
    // Existing Firebase database parameters preserved
    databaseURL: "https://apex-production-report-default-rtdb.firebaseio.com" // or existing DB URL
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// Shift & Production Date Helper matching existing shift logic
function getProductionDate(now = new Date()) {
    const hours = now.getHours();
    const dateCopy = new Date(now);
    // If between 00:00 and 08:00 (3rd shift), it belongs to previous production date
    if (hours < 8) {
        dateCopy.setDate(dateCopy.getDate() - 1);
    }
    const year = dateCopy.getFullYear();
    const month = String(dateCopy.getMonth() + 1).padStart(2, '0');
    const day = String(dateCopy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Set default date on load
document.addEventListener('DOMContentLoaded', () => {
    const defaultDate = getProductionDate();
    const prodDateInput = document.getElementById('prodDate');
    if (prodDateInput) prodDateInput.value = defaultDate;

    const targetProdDate = document.getElementById('targetProdDate');
    if (targetProdDate) targetProdDate.value = defaultDate;

    initTargetModal();
    initFormHandlers();
});

// Process Lists by Unit
const UNIT_PROCESSES = {
    'Unit 1': ['Printing', 'Lamination', 'Slitting', 'Extrusion Coating'],
    'Unit 2': ['Printing', 'Lamination', 'ColdSeal', 'Slitting']
};

// Target Modal Functionality
function initTargetModal() {
    const openBtn = document.getElementById('openTargetModalBtn');
    const closeBtn = document.getElementById('closeTargetModalBtn');
    const modal = document.getElementById('targetModal');
    const unitSelect = document.getElementById('targetUnit');
    const targetForm = document.getElementById('targetForm');

    if (openBtn) {
        openBtn.addEventListener('click', () => {
            modal.style.display = 'flex';
            renderTargetFields(unitSelect.value);
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    if (unitSelect) {
        unitSelect.addEventListener('change', (e) => {
            renderTargetFields(e.target.value);
        });
    }

    if (targetForm) {
        targetForm.addEventListener('submit', handleSaveTarget);
    }
}

function renderTargetFields(unit) {
    const container = document.getElementById('targetProcessInputs');
    if (!container) return;

    const processes = UNIT_PROCESSES[unit] || UNIT_PROCESSES['Unit 1'];
    container.innerHTML = '';

    processes.forEach(proc => {
        const fieldKey = proc.toLowerCase().replace(/\s+/g, '');
        const div = document.createElement('div');
        div.className = 'form-group target-field-group';
        div.innerHTML = `
            <label for="target_${fieldKey}">${proc} target (kg)</label>
            <input type="number" id="target_${fieldKey}" data-process="${proc}" step="0.01" min="0" placeholder="0" required>
        `;
        container.appendChild(div);
    });
}

function handleSaveTarget(e) {
    e.preventDefault();
    const date = document.getElementById('targetProdDate').value;
    const unit = document.getElementById('targetUnit').value;
    const msgBanner = document.getElementById('targetSaveMessage');

    if (!date || !unit) return;

    const unitKey = unit.toLowerCase().replace(/\s+/g, ''); // unit1 or unit2
    const inputs = document.querySelectorAll('#targetProcessInputs input');
    
    const targetData = {};
    inputs.forEach(input => {
        const procName = input.getAttribute('data-process');
        const procKey = procName.toLowerCase().replace(/\s+/g, '');
        targetData[procKey] = parseFloat(input.value) || 0;
    });

    // Save/Overwrite to Firebase at dailyTargets/YYYY-MM-DD/unit1
    db.ref(`dailyTargets/${date}/${unitKey}`).set(targetData)
        .then(() => {
            msgBanner.className = 'message-banner success';
            msgBanner.innerText = 'Target saved successfully.';
            setTimeout(() => {
                msgBanner.innerText = '';
                msgBanner.className = 'message-banner';
                document.getElementById('targetModal').style.display = 'none';
            }, 1200);
        })
        .catch(err => {
            msgBanner.className = 'message-banner error';
            msgBanner.innerText = 'Error saving target: ' + err.message;
        });
}

// Form Handlers (Preserving Existing Report Submissions)
function initFormHandlers() {
    const unitSelect = document.getElementById('unit');
    const processSelect = document.getElementById('process');

    if (unitSelect && processSelect) {
        unitSelect.addEventListener('change', (e) => {
            const unit = e.target.value;
            processSelect.innerHTML = '<option value="">Select Process</option>';
            if (UNIT_PROCESSES[unit]) {
                UNIT_PROCESSES[unit].forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p;
                    opt.textContent = p;
                    processSelect.appendChild(opt);
                });
            }
        });
    }

    const prodForm = document.getElementById('productionForm');
    if (prodForm) {
        prodForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const report = {
                date: document.getElementById('prodDate').value,
                shift: document.getElementById('shift').value,
                unit: document.getElementById('unit').value,
                process: document.getElementById('process').value,
                machine: document.getElementById('machine').value,
                operator: document.getElementById('operator').value,
                jobName: document.getElementById('jobName').value,
                outputKg: parseFloat(document.getElementById('outputKg').value) || 0,
                wasteKg: parseFloat(document.getElementById('wasteKg').value) || 0,
                remarks: document.getElementById('remarks').value,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            };

            db.ref('reports').push(report).then(() => {
                const msg = document.getElementById('submitMessage');
                msg.className = 'message-banner success';
                msg.innerText = 'Report submitted successfully!';
                prodForm.reset();
                document.getElementById('prodDate').value = getProductionDate();
                setTimeout(() => { msg.innerText = ''; }, 3000);
            });
        });
    }
}
