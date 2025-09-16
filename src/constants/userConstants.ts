export const USER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DELETED: 'deleted'
} as const;

export const VALID_ADMIN_STATUSES: readonly string[] = ['active', 'suspended', 'deleted'];
export const VALID_SELF_STATUSES: readonly string[] = ['active', 'suspended'];

export const ERROR_MESSAGES = {
  USER_NOT_FOUND: "User not found or no changes were made.",
  UNAUTHORIZED: "Unauthorized.",
  INVALID_STATUS: "Invalid status value.",
  NO_CHANGES: "No changes were made.",
  INTERNAL_ERROR: "Internal server error.",
} as const;

export const SUCCESS_MESSAGES = {
  USER_UPDATED: "User information updated successfully.",
  STATUS_UPDATED: (status: string) => `User status updated to '${status}' successfully.`,
  SELF_STATUS_UPDATED: (status: string) => `Your status updated to '${status}' successfully.`,
} as const;