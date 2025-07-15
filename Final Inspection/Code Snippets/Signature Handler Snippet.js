// signature-handler.js
// Handles digital signature capture, preview injection, and timestamp updates for Final Inspection forms

function launchSignaturePopup(slotId) {
    const timestamp = new Date().toISOString();

    // Pass timestamps in URL to pre-fill on popup
    const popupUrl = `/html/sigPad.html?approved=${timestamp}&released=${timestamp}`;
    const popup = window.open(popupUrl, "_blank", "width=600,height=400");

    // Pass identifier to the signature window for context (e.g., slot 1 or 2)
    popup.signatureSlot = slotId;
}

// Injects captured signature into the matching DOM container and updates corresponding timestamp
function injectSignature(signatureUrl, slotId) {
    const container = document.getElementById(`signatureTarget${slotId}`);

    if (!container) {
        console.error("Signature container not found for slot:", slotId);
        return;
    }

    // Create and configure the signature preview image
    const preview = new Image();
    preview.src = signatureUrl;
    preview.style.width = "50%";
    preview.style.height = "auto";

    // Replace any existing content with new image
    container.innerHTML = "";
    container.appendChild(preview);

    // Quick fix: reapply dimensions after DOM injection
    setTimeout(() => {
        preview.style.width = "50%";
        preview.style.height = "auto";
    }, 100);

    const currentTime = new Date().toISOString();

    // Automatically set corresponding timestamp field (based on slot)
    if (slotId === 2) {
        const field = document.getElementById("timestampApproved");
        if (field && !field.value) {
            field.value = currentTime;
        } else {
            console.warn("timestampApproved field not found or already filled.");
        }
    } else {
        const field = document.getElementById("timestampReleased");
        if (field && !field.value) {
            field.value = currentTime;
        } else {
            console.warn("timestampReleased field not found or already filled.");
        }
    }
}
