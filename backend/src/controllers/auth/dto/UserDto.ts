import type { User, UserRole } from "../../../domain/user/User";

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl: string | null;
}

export function toUserDto(user: User): UserDto {
  return {
    id: user.id.value,
    email: user.email.value,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    avatarUrl: user.avatarUrl,
  };
}
