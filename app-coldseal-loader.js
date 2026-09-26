const source = await fetch("./app.js").then(response => response.text());

const patchedSource = source
    .replace(/("Lamination": \[[\s\S]*?\n        \],)/g, '$1\n\n        "ColdSeal": [\n            "ColdSeal"\n        ],')
    .replace('process.value === "Printing" ||\n            process.value === "Lamination"', 'process.value === "Printing" ||\n            process.value === "Lamination" ||\n            process.value === "ColdSeal"')
    .replace('process.value === "Lamination"\n    )', 'process.value === "Lamination" ||\n        process.value === "ColdSeal"\n    )');

const blob = new Blob([patchedSource], { type: "text/javascript" });
await import(URL.createObjectURL(blob));
