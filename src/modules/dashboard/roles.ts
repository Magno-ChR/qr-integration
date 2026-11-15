export const dashboardRoles = ["admin", "cobrador"] as const;

export type DashboardRole = (typeof dashboardRoles)[number];

export const roleLabels: Record<DashboardRole, string> = {
  admin: "Administrador",
  cobrador: "Cobrador",
};

export function isDashboardRole(value: string): value is DashboardRole {
  return dashboardRoles.includes(value as DashboardRole);
}
