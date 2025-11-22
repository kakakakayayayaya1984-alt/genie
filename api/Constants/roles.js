export const ADMIN = 'admin';
export const SUPER_ADMIN = 'super_admin';

export const HotelRole = {
  ADMIN: 'hotel_admin',
  MANAGER: 'hotel_manager',
  SUPERVISOR: 'hotel_supervisor',
  ASSOCIATE: 'hotel_associate',
  TRAINEE: 'hotel_trainee',
};

export const HotelRoles = Object.values(HotelRole);

export const RolePriority = {
  [HotelRole.ADMIN]: 5,
  [HotelRole.MANAGER]: 4,
  [HotelRole.SUPERVISOR]: 3,
  [HotelRole.ASSOCIATE]: 2,
  [HotelRole.TRAINEE]: 1,
};

export const MAX_LOAD_BY_ROLE = {
  [HotelRole.ADMIN]: 1,
  [HotelRole.MANAGER]: 1,
  [HotelRole.SUPERVISOR]: 2,
  [HotelRole.ASSOCIATE]: 2,
  [HotelRole.TRAINEE]: 2,
};
