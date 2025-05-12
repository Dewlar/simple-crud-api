import http, { IncomingMessage, ServerResponse } from 'http';
import { config } from 'dotenv';
import { getParsedBody } from './helpers/requests.helper.js';
import { isUserType, isUserValid, mockUsers } from './helpers/user.helper.js';
import { User } from './models/user.model.js';
import { v4 as uniqId } from 'uuid';

config();

const PORT = process.env.PORT || 30332;

const server = http.createServer(
  async (req: IncomingMessage, res: ServerResponse) => {
    try {
      if (req.method === 'GET' && req.url === '/users') {
        getUsers(res, mockUsers);
      } else if (req.method === 'POST' && req.url === '/users') {
        const body = await getParsedBody(req);

        if (isUserType(body)) {
          const newUser: User = {
            id: uniqId(),
            ...body,
          };
          mockUsers.push(newUser);

          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(newUser));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              message:
                'Request body does not contain the required fields.',
            })
          );
        }
      } else if (req.method === 'GET' && req.url?.startsWith('/users/')) {
        const path = req.url;
        const userId = path.replace('/users/', '');
        if (isUserValid(res, userId)) {
          const user = mockUsers.find((currUser) => currUser.id === userId);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(user));
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            message: `Such resource not found. Please check the URL`,
          })
        );
      }
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          message:
            'Internal server error.',
        })
      );
    }
  }
);

function getUsers(res: ServerResponse, users: User[]) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(users));
}
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
