/**
 * Predictive search filtering for part name, number, and description.
 * Used to help users avoid duplicates and speed up entry.
 */


// Triggered when the user types in the "label" (i.e., part name) input field
onLabelInput(index: number): void {
  const labelInput = this.itemList[index].label.trim().toLowerCase();

  if (labelInput.length > 0) {
    // Fetch matching part labels (names) and filter client-side for partial matches
    this.itemList[index].filteredLabelOptions = this.formService.fetchLabels(labelInput).pipe(
      map((res: any) => {
        const allLabels = res?.$values || [];
        return allLabels.filter(option => option.toLowerCase().includes(labelInput));
      })
    );
  } else {
    // Clear suggestions if input is empty
    this.itemList[index].filteredLabelOptions = new Observable<string[]>();
  }
}

// Triggered when the user types in the "partId" (i.e., part number) input field
onCodeInput(index: number): void {
  const partCode = this.itemList[index].partId.trim().toLowerCase();

  if (partCode.length > 0) {
    // Fetch matching part numbers and filter client-side
    this.itemList[index].filteredCodeOptions = this.formService.fetchCodes(partCode).pipe(
      map((res: any) => {
        const allCodes = res?.$values || [];
        return allCodes.filter((code: string) => code.toLowerCase().includes(partCode));
      })
    );
  } else {
    this.itemList[index].filteredCodeOptions = new Observable<string[]>();
  }
}

// Triggered when the user types in the "notes" (i.e., description) input field
onNotesInput(index: number): void {
  const notesInput = this.itemList[index].notes.trim().toLowerCase();

  if (notesInput.length > 0) {
    // Fetch matching descriptions and filter
    this.itemList[index].filteredNotesOptions = this.formService.fetchNotes(notesInput).pipe(
      map((res: any) => {
        const allNotes = res?.$values || [];
        return allNotes.filter((desc: string) => desc.toLowerCase().includes(notesInput));
      })
    );
  } else {
    this.itemList[index].filteredNotesOptions = new Observable<string[]>();
  }
}

// When a label (part name) is selected from autocomplete dropdown
onLabelSelected(event: MatAutocompleteSelectedEvent, index: number): void {
  const selectedLabel = event.option.value;

  // Request all part details associated with selected label
  this.formService.getDetailsByLabel(selectedLabel).subscribe((res: PartResponseWrapper) => {
    const parts: Part[] = res?.$values || [];
    const currentItem = this.itemList[index];

    if (parts.length === 1) {
      // Only one part matched → populate item directly
      this.populateFromPart(parts[0], index);
    } else if (parts.length > 1) {
      // Multiple parts matched → show part number suggestions
      currentItem.label = selectedLabel;
      const codeOptions = [...new Set(parts.map(p => p.strPartNumber))];
      currentItem.filteredCodeOptions = of(codeOptions);
      currentItem.partId = '';

      if (codeOptions.length === 1) {
        // Auto-select part number if only one match
        currentItem.partId = codeOptions[0];
        const match = parts.find(p => p.strPartNumber === codeOptions[0]);
        if (match) this.populateFromPart(match, index);
      } else {
        // Trigger part number input UI manually to force dropdown display
        setTimeout(() => {
          const field = document.querySelectorAll('textarea')[index * 3 + 1] as HTMLTextAreaElement;
          field?.dispatchEvent(new Event('focus'));
          field?.dispatchEvent(new Event('input'));
        }, 0);
      }

      // Auto-resize label input after selection
      setTimeout(() => {
        const labelField = document.querySelectorAll('textarea')[index * 3] as HTMLTextAreaElement;
        if (labelField) this.autoResizeTextarea(labelField);
      }, 0);
    }

    // Update other fields if both label and code are selected
    this.recalculateDerivedData(index);
  });
}

// When a part number is selected from autocomplete dropdown
onCodeSelected(event: MatAutocompleteSelectedEvent, index: number): void {
  const selectedCode = event.option.value;

  this.formService.getDetailsByCode(selectedCode).subscribe(res => {
    const matches: Part[] = res?.$values || [];
    const currentItem = this.itemList[index];
    console.log(matches);

    if (matches.length === 1) {
      // Single match → auto-fill all details
      this.populateFromPart(matches[0], index);
    } else if (matches.length > 1) {
      // Multiple label options found for this part number
      currentItem.partId = selectedCode;
      const labelOptions = [...new Set(matches.map(p => p.strPartName))];
      currentItem.filteredLabelOptions = of(labelOptions);
      currentItem.label = '';

      if (labelOptions.length === 1) {
        // Auto-select label if only one match
        currentItem.label = labelOptions[0];
        const match = matches.find(p => p.strPartName === labelOptions[0]);
        if (match) this.populateFromPart(match, index);
      } else {
        // Trigger label input field to open suggestions
        setTimeout(() => {
          const field = document.querySelectorAll('textarea')[index * 3];
          field?.dispatchEvent(new Event('focus'));
          field?.dispatchEvent(new Event('input'));
        }, 0);
      }

      // Auto-resize label input field for better UX
      setTimeout(() => {
        const field = document.querySelectorAll('textarea')[index * 3];
        if (field) this.autoResizeTextarea(field as HTMLTextAreaElement);
      }, 0);
    }

    this.recalculateDerivedData(index);
  });
}
