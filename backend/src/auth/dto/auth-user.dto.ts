import { Role } from '../../common/enums/role.enum';
import { User } from '../../entities';

export class AuthUserDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: Role;
  isEmailVerified: boolean;

  static from(user: User): AuthUserDto {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    };
  }
}
