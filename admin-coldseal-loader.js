const source = await fetch("./admin.js").then(response => response.text());

const patchedSource = source.replace(
    /("Lamination": \[[\s\S]*?\n        \],)/g,
    '$1\n\n        "ColdSeal": [\n            "ColdSeal"\n        ],'
);

const blob = new Blob([patchedSource], { type: "text/javascript" });
await import(URL.createObjectURL(blob));
