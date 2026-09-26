const source = await fetch("./manager.js").then(response => response.text());
const patchedSource = source
    .replace('const reportDate = document.getElementById("reportDate");', 'const reportDate = document.getElementById("reportFromDate");\nconst reportToDate = document.getElementById("reportToDate");')
    .replace('const selectedDate = reportDate.value;', 'const selectedDate = reportDate.value;\n    const selectedToDate = reportToDate.value;')
    .replace('if (selectedDate) {\n\n        filteredReports = filteredReports.filter(\n            report => report.productionDate === selectedDate\n        );\n    }', 'if (selectedDate || selectedToDate) {\n        filteredReports = filteredReports.filter(report => {\n            const date = report.productionDate || "";\n            return (!selectedDate || date >= selectedDate) && (!selectedToDate || date <= selectedToDate);\n        });\n    }')
    .replace('reportDate.addEventListener(', 'reportDate.addEventListener(')
    .replace('reportDate.value = "";\n        shiftFilter.value', 'reportDate.value = "";\n        reportToDate.value = "";\n        shiftFilter.value');
const blob = new Blob([patchedSource], { type: "text/javascript" });
await import(URL.createObjectURL(blob));
