export const PERMISSIONS = {
  buyer: [
    "ticket:read",
    "order:create",
    "order:own",
    "report:create",
    "seller:apply",
  ],
  seller: [
    "ticket:read",
    "listing:create",
    "listing:own",
    "sale:own",
    "handover:update",
  ],
  admin: [
    "ticket:read",
    "user:manage",
    "seller:review",
    "listing:moderate",
    "cap:update",
    "report:review",
  ],
};
export const can = (role, permission) =>
  PERMISSIONS[role]?.includes(permission) ?? false;
