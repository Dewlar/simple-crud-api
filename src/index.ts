import { server } from './server';

const PORT = process.env.PORT || 30332;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
