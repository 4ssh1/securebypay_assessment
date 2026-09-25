import { Role } from '../../common/enums/role.enum';
import { User } from '../../entities';
import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({ example: '7b7f5f7e-3f0b-4c0b-8f4b-1f2f3d4e5a6b', format: 'uuid' })
  id: string;
  @ApiProperty({ example: 'Bunmi' })
  firstName: string;
  @ApiProperty({ example: 'Tanny' })
  lastName: string;
  @ApiProperty({ example: 'bunmi.tanny@example.com', format: 'email' })
  email: string;
  @ApiProperty({ example: '+2348010000004' })
  phone: string;
  @ApiProperty({ enum: Role, example: Role.USER })
  role: Role;
  @ApiProperty({ example: true })
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
