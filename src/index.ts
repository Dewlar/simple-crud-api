import http, { IncomingMessage, ServerResponse } from 'http';
import { config } from 'dotenv';
import { getParsedBody } from './helpers/requests.helper.js';
import { isUserType } from './helpers/user.helper.js';
import { User } from './models/user.model.js';
import { v4 as uniqId } from 'uuid';

config();

const PORT = process.env.PORT || 30332;
let mockUsers: User[] = [
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
