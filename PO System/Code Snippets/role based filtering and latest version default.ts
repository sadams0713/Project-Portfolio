/**
 * Filters for data  visibility based on user group and role using AD integration.
 * Supports multiple tiers and defaults to the latest version.
 */


private getLatestRevisions(entries: RecordItem[]): RecordItem[] {
  const sorted = entries.sort((a, b) => {
    const baseA = a.code.split('-').slice(0, 2).join('-');
    const baseB = b.code.split('-').slice(0, 2).join('-');

    if (baseA < baseB) return -1;
    if (baseA > baseB) return 1;

    const versionA = parseInt(a.code.split('-').pop() || '0', 10);
    const versionB = parseInt(b.code.split('-').pop() || '0', 10);

    return versionA - versionB;
  });

  // Use a map to overwrite earlier versions and retain only the latest
  const latestMap = new Map<string, RecordItem>();
  sorted.forEach(item => {
    const baseKey = item.code.split('-').slice(0, 2).join('-');
    latestMap.set(baseKey, item);
  });

  return Array.from(latestMap.values());
}

// Checks if the logged-in user belongs to a restricted group or organizational unit
isPrivilegedUser(): boolean {
  const sensitiveUnits = ['OU NAME HERE'];
  return sensitiveUnits.some(unit => this.ou.toLowerCase().includes(unit)) ||
    this.authservice.isUserInGroup('Group Name Here');
}

// Filters records for normal users based on creation and approval status
filterEntriesForUser(allItems: RecordItem[], createdBy: string): void {
  if (this.authservice.isUserInGroup('Group Name Here') || this.authservice.isUserInGroup('Group Name Here')) {
    this.filterForPrivilegedRoles(allItems);
    return;
  }

  // Items awaiting any approval (initial screen)
  this.queueGeneral = allItems.filter(item =>
    !item.flagA && item.initiator === createdBy
  );

  // Items pending secondary (manager) approval
  this.queueManager = allItems.filter(item =>
    item.flagA &&
    !item.flagB &&
    item.initiator === createdBy &&
    ((item.regionFlag && (item.amount ?? 0) < 5000) ||
      (!item.regionFlag && (item.amount ?? 0) < 100000))
  );

  // Items pending executive-level approval
  this.queueExecutive = allItems.filter(item =>
    item.flagA &&
    !item.flagB &&
    item.initiator === createdBy &&
    ((item.regionFlag && (item.amount ?? 0) >= 5000) ||
      (!item.regionFlag && (item.amount ?? 0) >= 100000))
  );

  // Fully approved but still open
  this.queueApproved = allItems.filter(item =>
    item.flagA &&
    item.flagB &&
    !item.closed &&
    item.initiator === createdBy
  );

  // Items marked as completed/closed
  this.queueClosed = allItems.filter(item =>
    item.closed && item.initiator === createdBy
  );
}

// Handles filtering logic for admin, IT, or corporate users
filterForPrivilegedRoles(allItems: RecordItem[]): void {
  if (this.authservice.isUserInGroup('Group Name Here') || this.authservice.isUserInGroup('Group Name Here')) {
    // Show all unapproved items
    this.queueGeneral = allItems.filter(item => !item.flagA);

    // Items awaiting secondary approval
    this.queueManager = allItems.filter(item =>
      item.flagA &&
      !item.flagB &&
      ((item.regionFlag && (item.amount ?? 0) < 5000) ||
        (!item.regionFlag && (item.amount ?? 0) < 100000))
    );

    // Items pending executive approval
    this.queueExecutive = allItems.filter(item =>
      item.flagA &&
      !item.flagB &&
      ((item.regionFlag && (item.amount ?? 0) >= 5000) ||
        (!item.regionFlag && (item.amount ?? 0) >= 100000))
    );

    // Approved and open
    this.queueApproved = allItems.filter(item =>
      item.flagA && item.flagB && !item.closed
    );

    // Closed/completed entries
    this.queueClosed = allItems.filter(item => item.closed);
  } else {
    // Fallback for non-privileged: show only entries without reviewer assigned
    this.queueGeneral = allItems.filter(item =>
      !item.flagA && !item.reviewer
    );

    this.queueManager = allItems.filter(item =>
      item.flagA &&
      !item.flagB &&
      ((item.regionFlag && (item.amount ?? 0) < 5000) ||
        (!item.regionFlag && (item.amount ?? 0) < 100000))
    );

    this.queueExecutive = allItems.filter(item =>
      item.flagA &&
      !item.flagB &&
      ((item.regionFlag && (item.amount ?? 0) >= 5000) ||
        (!item.regionFlag && (item.amount ?? 0) >= 100000))
    );

    this.queueApproved = allItems.filter(item =>
      item.flagA && item.flagB && !item.closed
    );

    this.queueClosed = allItems.filter(item => item.closed);
  }
}
