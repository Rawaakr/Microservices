import { Role } from '../auth/dto/signupdto.dto';

export function isValidRole(role: any): boolean {
  return Object.values(Role).includes(role);
}
