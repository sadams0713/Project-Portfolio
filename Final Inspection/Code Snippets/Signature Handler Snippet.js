// signature-handler.js
// Handles digital signature capture, preview injection, and timestamp updates for Final Inspection forms

function openSignaturePad(signatureNumber) {
    const currentDate = new Date().toISOString();
    const signaturePadUrl = \`/html/sigPad.html?dtmApproved=\${currentDate}&dtmReleased=\${currentDate}\`;
    const signaturePadWindow = window.open(signaturePadUrl, "_blank", "width=600,height=400");
    signaturePadWindow.signatureNumber = signatureNumber;
}

function updateSavedSignature(signatureDataURL, signatureNumber) {
    const savedSignatureContainer = document.getElementById(\`savedSignatureContainer\${signatureNumber}\`);

    if (!savedSignatureContainer) {
        console.error("Saved Signature Container not found.");
        return;
    }

    const img = new Image();
    img.src = signatureDataURL;
    img.style.width = "50%";
    img.style.height = "auto";

    savedSignatureContainer.innerHTML = "";
    savedSignatureContainer.appendChild(img);

    // Resize fix after DOM insertion
    setTimeout(() => {
        img.style.width = "50%";
        img.style.height = "auto";
    }, 100);

    const currentDate = new Date().toISOString();

    if (signatureNumber === 2) {
        const dtmApprovedField = document.getElementById("dtmApproved");
        if (dtmApprovedField && !dtmApprovedField.value) {
            dtmApprovedField.value = currentDate;
        } else {
            console.warn("dtmApproved field not found or already filled.");
        }
    } else {
        const dtmReleasedField = document.getElementById("dtmReleased");
        if (dtmReleasedField && !dtmReleasedField.value) {
            dtmReleasedField.value = currentDate;
        } else {
            console.warn("dtmReleased field not found or already filled.");
        }
    }
}
