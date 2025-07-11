/**
 * Filters PO visibility based on user group and role using AD integration.
 * Supports multiple tiers: regular user, PM, GM, admin.
 */


private filterLatestVersions(orders: PurchaseOrder[]): PurchaseOrder[] {
    const sortedOrders = orders.sort((a, b) => {
      const aBasePoNumber = a.strPonumber.split('-').slice(0, 2).join('-');
      const bBasePoNumber = b.strPonumber.split('-').slice(0, 2).join('-');

      if (aBasePoNumber < bBasePoNumber) return -1;
      if (aBasePoNumber > bBasePoNumber) return 1;

      const aVersion = parseInt(a.strPonumber.split('-').pop() || '0', 10);
      const bVersion = parseInt(b.strPonumber.split('-').pop() || '0', 10);

      return aVersion - bVersion;
    });

    const latestOrdersMap = new Map<string, PurchaseOrder>();

    sortedOrders.forEach(order => {
      const basePoNumber = order.strPonumber.split('-').slice(0, 2).join('-');
      latestOrdersMap.set(basePoNumber, order);
    });

    return Array.from(latestOrdersMap.values());
  }

isRestrictedOU(): boolean {
    const restrictedOUs = ['OU NAME HERE'];
    return restrictedOUs.some(ou => this.ou.toLowerCase().includes(ou)) ||
      this.authservice.isUserInGroup('Group Name Here');
  }

  filterOrdersForRestrictedUsers(allOrders: PurchaseOrder[], createdBy: string): void {
    if (this.authservice.isUserInGroup('Group Name Here') || this.authservice.isUserInGroup('Group Name Here')) {
      this.filterOrdersForCorporateAndITSupport(allOrders);
      return;
    }

    // console.log("all orders from api:", allOrders);
    // console.log("Filtering for user:", createdBy);

    this.pendingOrders = allOrders.filter(order =>
      !order.ysnApproved &&
      order.strCreatedBy === createdBy
    );
    // console.log("Pending Orders:", this.pendingOrders);

    this.pendingPMOrders = allOrders.filter(order =>
      !order.ysnGMApproved &&
      order.strCreatedBy === createdBy &&
      order.ysnApproved &&
      ((order.ysnUSDMX === true && (order.decPototal ?? 0) < 5000) ||
        (order.ysnUSDMX === false && (order.decPototal ?? 0) < 100000))
    );
    // console.log("Pending PM Orders:", this.pendingPMOrders);


    this.pendingGMOrders = allOrders.filter(order =>
      !order.ysnGMApproved &&
      order.ysnApproved &&
      order.strCreatedBy === createdBy &&
      ((order.ysnUSDMX === true && (order.decPototal ?? 0) >= 5000) ||
        (order.ysnUSDMX === false && (order.decPototal ?? 0) >= 100000))
    );
    // console.log("Pending GM Orders:", this.pendingGMOrders);


    this.approvedOrders = allOrders.filter(order =>
      order.ysnApproved &&
      order.ysnGMApproved &&
      !order.ysnClosed &&
      order.strCreatedBy === createdBy
    );

    this.closedOrders = allOrders.filter(order =>
      order.ysnClosed &&
      order.strCreatedBy === createdBy
    );
  }

  filterOrdersForCorporateAndITSupport(allOrders: PurchaseOrder[]): void {
    if (this.authservice.isUserInGroup('Group Name Here') || this.authservice.isUserInGroup('Group Name Here')) {
      this.pendingOrders = allOrders.filter(order => !order.ysnApproved);
      // console.log("Pending Orders:", this.pendingOrders);


      this.pendingPMOrders = allOrders.filter(order =>
        order.ysnApproved &&
        !order.ysnGMApproved &&
        ((order.ysnUSDMX == true && (order.decPototal ?? 0) < 5000) ||
          (order.ysnUSDMX == false && (order.decPototal ?? 0) < 100000))
      );
      // console.log("Pending PM Orders:", this.pendingPMOrders);


      this.pendingGMOrders = allOrders.filter(order =>
        order.ysnApproved &&
        !order.ysnGMApproved &&
        ((order.ysnUSDMX == true && (order.decPototal ?? 0) >= 5000) ||
          (order.ysnUSDMX == false && (order.decPototal ?? 0) >= 100000))
      );
      // console.log("Pending GM Orders:", this.pendingGMOrders);


      this.approvedOrders = allOrders.filter(order =>
        order.ysnApproved &&
        order.ysnGMApproved &&
        !order.ysnClosed
      );

      this.closedOrders = allOrders.filter(order => order.ysnClosed);
    } else {
      this.pendingOrders = allOrders.filter(order =>
        !order.ysnApproved &&
        !order.strPurchaseManager
      );

      this.pendingPMOrders = allOrders.filter(order =>
        order.ysnApproved &&
        !order.ysnGMApproved &&
        ((order.ysnUSDMX == true && (order.decPototal ?? 0) < 5000) ||
          (order.ysnUSDMX == false && (order.decPototal ?? 0) < 100000))
      );

      this.pendingGMOrders = allOrders.filter(order =>
        order.ysnApproved &&
        !order.ysnGMApproved &&
        ((order.ysnUSDMX == true && (order.decPototal ?? 0) >= 5000) ||
          (order.ysnUSDMX == false && (order.decPototal ?? 0) >= 100000))
      );

      this.approvedOrders = allOrders.filter(order =>
        order.ysnApproved &&
        order.ysnGMApproved &&
        !order.ysnClosed
      );

      this.closedOrders = allOrders.filter(order => order.ysnClosed);
    }
  }