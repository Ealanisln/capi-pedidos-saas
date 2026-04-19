import { Version } from "@prisma/client";

export function planLimits(version: Version) {
  if (version === Version.ENTERPRISE) {
    return {
      cashDrawers: 8,
      waiters: 30,
      tables: 120,
      printerStations: 12,
    };
  }

  if (version === Version.PRO) {
    return {
      cashDrawers: 3,
      waiters: 8,
      tables: 35,
      printerStations: 6,
    };
  }

  return {
    cashDrawers: 1,
    waiters: 2,
    tables: 10,
    printerStations: 3,
  };
}

export function applyPlanLimits(version: Version) {
  const limits = planLimits(version);
  return {
    maxCashDrawers: limits.cashDrawers,
    maxWaiters: limits.waiters,
    maxTables: limits.tables,
  };
}
