// types/user.types.ts (ปรับปรุงจากของเดิม)

// ========== Base User Types ==========
export interface User {
  uid: string;
  email: string;
  username: string;
  photo_url?: string | null;
  role: UserRole;
  birthday?: string | null; // format: YYYY-MM-DD
  status: UserStatus;
  password?: string | null; // ใช้เฉพาะเวลาที่ต้องการ (ปกติไม่ควร return)
  created_at?: string;
  updated_at?: string;
}

// ========== Enum Types ==========
export type UserRole = 'admin' | 'member';
export type UserStatus = 'active' | 'suspended' | 'deleted';
export type UserStatusSelf = 'active' | 'suspended' | 'deleted'; // สำหรับ user เปลี่ยนสถานะตัวเอง

// ========== Authentication Types ==========
export interface UserRegister {
  email: string;
  username: string;
  password?: string; // optional เพราะอาจจะมาจาก Google Auth
  role?: UserRole;
  birthday?: string; // format: DD/MM/YYYY (input) -> convert to YYYY-MM-DD
  photo_url?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface AdminRegister {
  email: string;
  username: string;
  password: string;
}

// ========== Update/Edit Types ==========
export interface EditUserInfo {
  uid: string;
  username?: string;
  photo_url?: string;
  birthday?: string; // format: YYYY-MM-DD
  email?: string; // เพิ่ม email update (ถ้าต้องการ)
}

export interface ChangeUserStatus {
  uid: string;
  status: UserStatus;
}

export interface UpdateMyStatusRequest {
  status: UserStatusSelf;
}

// ========== Response Types ==========
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface UserResponse extends Omit<User, 'password'> {
  // User response without password field
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    userId: string;
    role: UserRole;
    token: string;
    user?: UserResponse;
  };
}

// ========== Database Types ==========
export interface UserRow {
  role: string;
  status?: string;
  // เพิ่มฟิลด์อื่นๆ ตามที่จำเป็น
}

export interface UserCreateData {
  uid: string;
  email: string;
  username: string;
  photo_url?: string;
  role: UserRole;
  birthday?: string | null;
  status?: UserStatus;
  password?: string;
}

// ========== Query/Filter Types ==========
export interface UserQueryParams {
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  limit?: number;
  search?: string; // สำหรับค้นหา username หรือ email
}

export interface UserListResponse {
  users: UserResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ========== Validation Types ==========
export interface UserValidationError {
  field: string;
  message: string;
  value?: any;
}

// ========== Firebase/Google Auth Types ==========
export interface GoogleAuthUser {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
}

export interface FirebaseTokenPayload {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  iss: string;
  aud: string;
  auth_time: number;
  user_id: string;
  sub: string;
  iat: number;
  exp: number;
  email_verified?: boolean;
  firebase: {
    identities: {
      [key: string]: any;
    };
    sign_in_provider: string;
  };
}

// ========== JWT Types ==========
export interface JwtPayload {
  userId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// ========== Profile Types ==========
export interface UserProfile extends Omit<User, 'password'> {
  photo_url_full?: string; // full URL with server path
}

export interface UpdateProfileRequest {
  email?: string;
  username?: string;
  photo_url?: string;
  birthday?: string;
}

// ========== Statistics Types (เพิ่มเติม) ==========
export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  deletedUsers: number;
  newUsersToday: number;
  newUsersThisMonth: number;
}

// ========== Type Guards ==========
export const isValidUserRole = (role: string): role is UserRole => {
  return ['admin', 'member'].includes(role);
};

export const isValidUserStatus = (status: string): status is UserStatus => {
  return ['active', 'suspended', 'deleted'].includes(status);
};

export const isValidUserStatusSelf = (status: string): status is UserStatusSelf => {
  return ['active', 'suspended'].includes(status);
};

// ========== Constants ==========
export const USER_ROLES = {
  ADMIN: 'admin' as const,
  MEMBER: 'member' as const,
};

export const USER_STATUSES = {
  ACTIVE: 'active' as const,
  SUSPENDED: 'suspended' as const,
  DELETED: 'deleted' as const,
};

export const VALID_ADMIN_STATUSES: UserStatus[] = ['active', 'suspended', 'deleted'];
export const VALID_SELF_STATUSES: UserStatusSelf[] = ['active', 'suspended'];

// ========== Default Values ==========
export const DEFAULT_USER_ROLE: UserRole = 'member';
export const DEFAULT_USER_STATUS: UserStatus = 'active';

// Export all as named exports for better tree shaking
export default {
  USER_ROLES,
  USER_STATUSES,
  VALID_ADMIN_STATUSES,
  VALID_SELF_STATUSES,
  DEFAULT_USER_ROLE,
  DEFAULT_USER_STATUS,
};
export interface EditUserInfoBody {
  username?: string;
  email?: string;
  photo_url?: string | null;
  birthday?: string | null; // ส่ง null เพื่อลบค่าได้
}
export interface EditUserPayload {
  username?: string;
  birthday?: string;
}