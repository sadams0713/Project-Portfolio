/**
 * Predictive search filtering for part name, number, and description.
 * Used to help users avoid duplicates and speed up entry.
 */


onPartNameInput(index: number) {
  const partNameValue = this.items[index].partName.trim().toLowerCase();

  if (partNameValue.length > 0) {
    this.items[index].filteredPartNameOptions = this.poFormService.getPartNames(partNameValue).pipe(
      map((response: any) => {
        const partNames = response?.$values || [];
        return partNames.filter(option => option.toLowerCase().includes(partNameValue));
      })
    );
  } else {
    this.items[index].filteredPartNameOptions = new Observable<string[]>();
  }
}

onPartNumberInput(index: number) {
    const partNumberValue = this.items[index].partNumber.trim().toLowerCase();

    if (partNumberValue.length > 0) {
      this.items[index].filteredPartNumberOptions = this.poFormService.getPartNumbers(partNumberValue).pipe(
        map((response: any) => {
          const partNumbers = response?.$values || [];
          return partNumbers.filter((option: string) => option.toLowerCase().includes(partNumberValue));
        })
      );
    } else {
      this.items[index].filteredPartNumberOptions = new Observable<string[]>();
    }
  }

  onDescriptionInput(index: number) {
    const descriptionValue = this.items[index].description.trim().toLowerCase();

    if (descriptionValue.length > 0) {
      this.items[index].filteredDescriptionOptions = this.poFormService.getDescriptions(descriptionValue).pipe(
        map((response: any) => {
          const descriptions = response?.$values || [];
          return descriptions.filter((option: string) => option.toLowerCase().includes(descriptionValue));
        })
      );
    } else {
      this.items[index].filteredDescriptionOptions = new Observable<string[]>();
    }
  }

  onPartNameSelection(event: MatAutocompleteSelectedEvent, index: number): void {
    const selectedPartName = event.option.value;

    this.poFormService.getPartDetailsByName(selectedPartName).subscribe((response: PartResponseWrapper) => {
      const matches: Part[] = response?.$values || [];
      const item = this.items[index];

      if (matches.length === 1) {
        this.populateItemWithPart(matches[0], index);
      } else if (matches.length > 1) {
        item.partName = selectedPartName;

        const partNumbers = [...new Set(matches.map((m: Part) => m.strPartNumber))];
        item.filteredPartNumberOptions = of(partNumbers);
        item.partNumber = '';

        if (partNumbers.length === 1) {
          item.partNumber = partNumbers[0];
          const match = matches.find((m: Part) => m.strPartNumber === partNumbers[0]);
          if (match) this.populateItemWithPart(match, index);
        } else {
          setTimeout(() => {
            const autoTrigger = document.querySelectorAll('textarea')[index * 3 + 1] as HTMLTextAreaElement;
            autoTrigger?.dispatchEvent(new Event('focus'));
            autoTrigger?.dispatchEvent(new Event('input'));
          }, 0);
        }

        setTimeout(() => {
          const partNameTextarea = document.querySelectorAll('textarea')[index * 3] as HTMLTextAreaElement;
          if (partNameTextarea) this.autoResizeTextarea(partNameTextarea);
        }, 0);
      }

      this.updateDetailsIfBothSelected(index);
    });
  }

  onPartNumberSelection(event: MatAutocompleteSelectedEvent, index: number): void {
    const selectedPartNumber = event.option.value;

    this.poFormService.getPartDetailsByNumber(selectedPartNumber).subscribe(response => {
      const matches: Part[] = response?.$values || [];
      const item = this.items[index];
      console.log(matches);

      if (matches.length === 1) {
        this.populateItemWithPart(matches[0], index);
      } else if (matches.length > 1) {
        item.partNumber = selectedPartNumber;

        const partNames = [...new Set(matches.map((m: Part) => m.strPartName))];
        item.filteredPartNameOptions = of(partNames);
        item.partName = '';

        if (partNames.length === 1) {
          item.partName = partNames[0];
          const match = matches.find((m: Part) => m.strPartName === partNames[0]);
          if (match) this.populateItemWithPart(match, index);
        } else {
          setTimeout(() => {
            const autoTrigger = document.querySelectorAll('textarea')[index * 3];
            autoTrigger?.dispatchEvent(new Event('focus'));
            autoTrigger?.dispatchEvent(new Event('input'));
          }, 0);
        }
        setTimeout(() => {
          const textareas = document.querySelectorAll('textarea');
          const textarea = textareas[index * 3];
          if (textarea) this.autoResizeTextarea(textarea as HTMLTextAreaElement);
        }, 0);
      }

      this.updateDetailsIfBothSelected(index);
    });
  }