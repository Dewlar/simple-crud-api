import { User } from '../models/user.model.js';

export function isUserType(obj: any): obj is User {
  return typeof obj === 'object' &&
    obj !== null &&
    (typeof obj.id === 'undefined' || typeof obj.id === 'string') &&
    typeof obj.username === 'string' &&
    typeof obj.age === 'number' &&
    Array.isArray(obj.hobbies) &&
    obj.hobbies.every((hobby: any) => typeof hobby === 'string');
}
