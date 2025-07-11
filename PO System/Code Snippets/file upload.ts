/**
 * Handles user-selected file uploads and saves them as a PO draft.
 * Triggers auto-draft saving when files are selected.
 */


onFileSelected(event: any): void {
  const newFiles: File[] = Array.from(event.target.files);
  if (!newFiles || newFiles.length === 0) return;
  
  this.selectedFiles = newFiles;
  this.fileUploadSaveAsDraft();

  this.uploadedFiles.push(...newFiles.map(file => ({
    iid: 0,
    fileName: file.name,
    filePath: '',
    url: `{{filepath_here}}/${this.purchaseOrder.iid}/${file.name}` // Consider masking full URL
  })));
}


fileUploadSaveAsDraft(): void {
    const setNullToZero = (value: any) => value != null ? value : 0;
    const setNullToEmptyString = (value: any): string => value != null ? value : '';
    const setNullToFalse = (value: any): boolean => value != null ? value : false;
    this.purchaseOrder.originalDraftPoNumber = this.generatedPONumber;


    this.purchaseOrder.dtmCreated = new Date();
    this.purchaseOrder.strPonumber = setNullToEmptyString(this.purchaseOrder.strPonumber);
    this.purchaseOrder.idTblSupplier = this.selectedSupplier?.iid || 0;
    this.purchaseOrder.idTblContact = this.selectedContact?.iid || 0;
    this.purchaseOrder.dtmDue = this.purchaseOrder.dtmDue || new Date();
    this.purchaseOrder.strPayment = setNullToEmptyString(this.purchaseOrder.strPayment);
    this.purchaseOrder.strCreatedBy = setNullToEmptyString(this.userDetails?.commonName);
    this.purchaseOrder.strShipping = setNullToEmptyString(this.purchaseOrder.strShipping);
    this.purchaseOrder.idTblDepartment = this.purchaseOrder.idTblDepartment || 0;
    this.purchaseOrder.ysnConfirmation = setNullToFalse(this.purchaseOrder.ysnConfirmation);
    this.purchaseOrder.strConfirmation = setNullToEmptyString(this.purchaseOrder.strConfirmation);
    this.purchaseOrder.strUsoCfdi = setNullToEmptyString(this.purchaseOrder.strUsoCfdi);
    this.purchaseOrder.ysnUrgent = setNullToFalse(this.purchaseOrder.ysnUrgent);

    this.purchaseOrder.decFreight = setNullToZero(this.purchaseOrder.decFreight);
    this.purchaseOrder.decDiscount = setNullToZero(this.purchaseOrder.decDiscount);
    this.purchaseOrder.decTax = setNullToZero(this.purchaseOrder.decTax);
    this.purchaseOrder.decSubtotal = setNullToZero(this.purchaseOrder.decSubtotal);
    this.purchaseOrder.decPototal = setNullToZero(this.purchaseOrder.decPototal);

    this.purchaseOrder.decIVAWithholding = this.purchaseOrder.ysnIVAWithholding
      ? this.withholdingPercentage || 0
      : 0;

    this.purchaseOrder.decISRWithholding = this.purchaseOrder.ysnISRWithholding
      ? this.withholdingPercentage2 || 0
      : 0;

    this.purchaseOrder.lineItems = this.items
      .filter(item => item.quantity && item.partName)
      .map(item => ({
        decQuantity: setNullToZero(item.quantity),
        strUnit: setNullToEmptyString(item.unit),
        strPartNumber: setNullToEmptyString(item.partNumber),
        strPartName: setNullToEmptyString(item.partName),
        strDescription: setNullToEmptyString(item.description),
        decUnitPrice: setNullToZero(item.unitPrice),
        decTotalUnitPrice: setNullToZero(item.quantity) * setNullToZero(item.unitPrice),
        ysnTax: setNullToFalse(item.tax)
      }));

    this.poFormService.savePurchaseOrderDraft(this.purchaseOrder).subscribe(
      (response: any) => {
        console.log('Draft saved!', response);

        if (!this.purchaseOrder.iid && response?.draftIid) {
          this.purchaseOrder.iid = response.draftIid;
          this.purchaseOrder.originalDraftPoNumber = this.generatedPONumber;
        }
        if (this.selectedFiles?.length > 0) {
          this.uploadDraftFiles(this.purchaseOrder.iid);
        }
      },
      error => {
        console.error('Error saving draft:', error);
      }
    );
  }