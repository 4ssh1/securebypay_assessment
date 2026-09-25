import { Role } from '../../common/enums/role.enum';
import { SessionUser } from '../../common/interfaces/session-user.interface';
import { Shipment } from '../../entities';
import { ShipmentPolicy } from './shipment.policy';

const user = (role: Role, id = 'u1'): SessionUser => ({ id, role, sessionId: 's' });
const shipment = { senderId: 'u1' } as Shipment;

describe('ShipmentPolicy', () => {
  const policy = new ShipmentPolicy();

  it('scopes customers to their own data and staff-and-above to everything', () => {
    expect(policy.scopeOf(user(Role.USER))).toBe('own');
    expect(policy.scopeOf(user(Role.STAFF))).toBe('all');
    expect(policy.scopeOf(user(Role.MANAGER))).toBe('all');
    expect(policy.scopeOf(user(Role.ADMIN))).toBe('all');
  });

  it('denies unknown roles by default', () => {
    expect(() => policy.scopeOf(user('intruder' as Role))).toThrow();
  });

  it('lets a customer read only their own shipment', () => {
    expect(policy.canRead(user(Role.USER, 'u1'), shipment)).toBe(true);
    expect(policy.canRead(user(Role.USER, 'u2'), shipment)).toBe(false);
    expect(policy.canRead(user(Role.STAFF, 'u9'), shipment)).toBe(true);
  });

  it('lets only the owning customer pay', () => {
    expect(policy.canPay(user(Role.USER, 'u1'), shipment)).toBe(true);
    expect(policy.canPay(user(Role.USER, 'u2'), shipment)).toBe(false);
    expect(policy.canPay(user(Role.ADMIN, 'u1'), shipment)).toBe(false);
  });
});
