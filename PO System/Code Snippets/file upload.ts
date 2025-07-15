/**
 * Handles user-selected file uploads and saves them as a PO draft.
 * Triggers auto-draft saving when files are selected.
 */


onFileDrop(event: any): void {
  const incomingFiles: File[] = Array.from(event.target.files);
  if (!incomingFiles || incomingFiles.length === 0) return;

  // Store selected files in a temporary local array
  this.localFiles = incomingFiles;

  // Save the rest of the draft entry
  this.cacheTempEntry();

  // Update the UI list of files with metadata for display or tracking
  this.fileManifest.push(
    ...incomingFiles.map(file => ({
      id: 0, // Placeholder ID for unsaved files
      name: file.name,
      path: '',
      link: `{{filepath_here}}/${this.dataModel.id}/${file.name}` // Will be replaced with real path after upload
    }))
  );
}

// Saves the current form values as a draft to the backend
cacheTempEntry(): void {
  // Helper: returns 0 if value is null or undefined
  const defaultToZero = (val: any) => val != null ? val : 0;

  // Helper: returns empty string if value is null or undefined
  const defaultToString = (val: any): string => val != null ? val : '';

  // Helper: returns false if value is null or undefined
  const defaultToBool = (val: any): boolean => val != null ? val : false;

  // Set a reference code (i.e., draft number) for this temporary entry
  this.dataModel.fallbackCode = this.tempReferenceCode;

  // Set creation timestamp
  this.dataModel.createdOn = new Date();

  // Normalize and assign general properties
  this.dataModel.referenceCode = defaultToString(this.dataModel.referenceCode);
  this.dataModel.vendorId = this.chosenVendor?.id || 0;
  this.dataModel.contactId = this.chosenContact?.id || 0;
  this.dataModel.dueDate = this.dataModel.dueDate || new Date();
  this.dataModel.paymentTerms = defaultToString(this.dataModel.paymentTerms);
  this.dataModel.initiator = defaultToString(this.userInfo?.commonName);
  this.dataModel.shippingNotes = defaultToString(this.dataModel.shippingNotes);
  this.dataModel.divisionId = this.dataModel.divisionId || 0;
  this.dataModel.confirmed = defaultToBool(this.dataModel.confirmed);
  this.dataModel.confirmationDetails = defaultToString(this.dataModel.confirmationDetails);
  this.dataModel.priorityFlag = defaultToBool(this.dataModel.priorityFlag);

  // Normalize and assign financials
  this.dataModel.shippingAmount = defaultToZero(this.dataModel.shippingAmount);
  this.dataModel.discountAmount = defaultToZero(this.dataModel.discountAmount);
  this.dataModel.taxAmount = defaultToZero(this.dataModel.taxAmount);
  this.dataModel.subtotalAmount = defaultToZero(this.dataModel.subtotalAmount);
  this.dataModel.totalAmount = defaultToZero(this.dataModel.totalAmount);

  // Conditional tax withholdings
  this.dataModel.ivaHoldback = this.dataModel.hasIvaHoldback
    ? this.ivaRate || 0
    : 0;

  this.dataModel.isrHoldback = this.dataModel.hasIsrHoldback
    ? this.isrRate || 0
    : 0;

  // Process and normalize each line item before saving
  this.dataModel.details = this.itemList
    .filter(item => item.quantity && item.label) // Only include valid items
    .map(item => ({
      quantity: defaultToZero(item.quantity),
      unitType: defaultToString(item.unit),
      partId: defaultToString(item.partNumber),
      label: defaultToString(item.label),
      notes: defaultToString(item.notes),
      rate: defaultToZero(item.unitPrice),
      total: defaultToZero(item.quantity) * defaultToZero(item.unitPrice),
      taxed: defaultToBool(item.tax)
    }));

  // Save draft to backend API
  this.formService.saveDraft(this.dataModel).subscribe(
    (result: any) => {
      console.log('Draft saved successfully!', result);

      // If no ID exists (first save), assign returned draft ID
      if (!this.dataModel.id && result?.draftId) {
        this.dataModel.id = result.draftId;
        this.dataModel.fallbackCode = this.tempReferenceCode;
      }

      // If files were selected, begin file upload process
      if (this.localFiles?.length > 0) {
        this.pushDraftFiles(this.dataModel.id);
      }
    },
    error => {
      // Handle backend save error
      console.error('Failed to save draft:', error);
    }
  );
}
