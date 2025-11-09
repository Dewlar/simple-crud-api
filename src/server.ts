import { config } from 'dotenv';
import http, { IncomingMessage, ServerResponse } from 'http';
import { v4 as uniqId } from 'uuid';
import { getParsedBody } from './helpers/requests.helper';
import { isUserType, isUserValid, mockUsers, respondWithData, respondWithErrorMessage } from './helpers/user.helper';
import { MasterToWorkerMessage } from './models/server.models';
import { User } from './models/user.model';

config();

if (typeof process !== 'undefined' && typeof process.on === 'function') {
  process.on('message', (msg: MasterToWorkerMessage) => {
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'replaceState' && Array.isArray(msg.state)) {
      mockUsers.length = 0;
      for (const u of msg.state) {
        mockUsers.push(u);
      }
    }
  });
}

export const server = http.createServer(
  async (req: IncomingMessage, res: ServerResponse) => {
    try {
      if (req.method === 'GET' && (req.url === '/api/users' || req.url === '/api/users/')) {
        respondWithData(res, 200, mockUsers);
      } else if (req.method === 'POST' && (req.url === '/api/users' || req.url === '/api/users/')) {
        const body = await getParsedBody(req);

        if (isUserType(body)) {
          const newUser: User = {
            id: uniqId(),
            ...body,
          };
          mockUsers.push(newUser);

          if (typeof process !== 'undefined' && typeof process.send === 'function') {
            process.send({ type: 'update', action: 'create', payload: newUser });
          }

          respondWithData(res, 201, newUser);
        } else {
          respondWithErrorMessage(res, 400, 'Request body does not contain the required fields.');
        }
      } else if (req.method === 'GET' && req.url?.startsWith('/api/users/')) {
        const path = req.url;
        const userId = path.replace('/api/users/', '');
        if (isUserValid(res, userId)) {
          const user = mockUsers.find((currUser) => currUser.id === userId);
          respondWithData(res, 200, user as User);
        }
      } else if (req.method === 'PUT' && req.url?.startsWith('/api/users/')) {
        const path = req.url;
        const userId = path.replace('/api/users/', '');
        if (isUserValid(res, userId)) {
          const userIndex = mockUsers.findIndex((currUser) => currUser.id === userId);

          const body = await getParsedBody(req);

          if (isUserType(body)) {
            mockUsers[userIndex] = {
              id: userId,
              ...body,
            };

            if (typeof process !== 'undefined' && typeof process.send === 'function') {
              process.send({ type: 'update', action: 'update', payload: mockUsers[userIndex] });
            }

            respondWithData(res, 200, mockUsers[userIndex]);
          } else {
            respondWithErrorMessage(res, 400, 'Request body does not contain the required fields or types of the fields do not match the expectations.');
          }
        }
      } else if (req.method === 'DELETE' && req.url?.startsWith('/api/users/')) {
        const path = req.url;
        const userId = path.replace('/api/users/', '');
        if (isUserValid(res, userId)) {
          const userIndex = mockUsers.findIndex((user) => user.id === userId);
          if (userIndex !== -1) {
            mockUsers.splice(userIndex, 1);

            if (typeof process !== 'undefined' && typeof process.send === 'function') {
              process.send({ type: 'update', action: 'delete', payload: { id: userId } });
            }

            res.writeHead(204);
            res.end();
          }
        }
      } else {
        respondWithErrorMessage(res, 404, 'Such resource not found. Please check the URL');
      }
    } catch (err) {
      respondWithErrorMessage(res, 500, 'Internal server error.');
    }
  }
);
