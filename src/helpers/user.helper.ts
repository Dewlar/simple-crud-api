import { ServerResponse } from 'http';
import { validate } from 'uuid';
import { User } from '../models/user.model.js';

export let mockUsers: User[] = [
  {
    id: '1',
    username: 'test1',
    age: 22,
    hobbies: ['sumo', 'run', 'sleep'],
  },
  {
    id: '2',
    username: 'test2',
    age: 33,
    hobbies: ['eat', 'listen music'],
  },
];

export function isUserType(obj: any): obj is User {
  return typeof obj === 'object' &&
    obj !== null &&
    (typeof obj.id === 'undefined' || typeof obj.id === 'string') &&
    typeof obj.username === 'string' &&
    typeof obj.age === 'number' &&
    Array.isArray(obj.hobbies) &&
    obj.hobbies.every((hobby: any) => typeof hobby === 'string');
}

export function isUserValid(res: ServerResponse, userId: string): boolean {
  const userIds = mockUsers.map((user) => user.id);

  if (!validate(userId)) {
    respondWithError(res, 400, 'UserId is not valid');
    return false;
  }

  const userExists = userIds.some(id => id === userId)
  if (!userExists) {
    respondWithError(res, 404, "User with such id doesn't exist");
    return false;
  }

  return true;
}

function respondWithError(res: ServerResponse, statusCode: number, message: string) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message }));
}
