import cluster from 'cluster';
import { cpus } from 'os';
import http from 'http';
import { URL } from 'url';
import { CreateUserPayload, WorkerToMasterMessage } from './models/server.models';

const basePort = Number(process.env.PORT || 30332);

function availableWorkersCount(): number {
  const cpusLen = cpus().length;
  const workerCount = (cpusLen > 1) ? cpusLen - 1 : 1;
  return workerCount;
}

if (cluster.isPrimary) {
  const workersCount = availableWorkersCount();
  const workerPorts: number[] = [];

  let masterState: CreateUserPayload[] = [];

  console.log(`Primary process pid=${process.pid}. Spawning ${workersCount} workers...`);

  for (let i = 0; i < workersCount; i++) {
    const workerPort = basePort + (i + 1);
    workerPorts.push(workerPort);

    const env = {
      ...process.env,
      PORT: String(workerPort),
      WORKER_INDEX: String(i + 1),
    };

    const worker = cluster.fork(env);

    worker.on('message', (msg: WorkerToMasterMessage) => {
      if (!msg || typeof msg !== 'object' || !msg.type) return;

      if (msg.type === 'requestState') {
        worker.send({ type: 'replaceState', state: masterState });
      } else if (msg.type === 'update') {
        const { action, payload } = msg;

        if (action === 'create') {
          masterState.push(payload);
        } else if (action === 'update') {
          const idx = masterState.findIndex((u) => u.id === payload.id);
          if (idx !== -1) masterState[idx] = payload;
        } else if (action === 'delete') {
          const idx = masterState.findIndex((u) => u.id === payload.id);
          if (idx !== -1) masterState.splice(idx, 1);
        }

        // broadcast updated full state to all workers
        for (const id in cluster.workers) {
          cluster.workers[id]?.send({ type: 'replaceState', state: masterState });
        }
      }
    });
  }

  // Create load balancer on basePort
  let roundRobinIndex = 0;
  const loadBalancerServer = http.createServer((req, res) => {
    if (workerPorts.length === 0) {
      res.writeHead(503);
      res.end('No workers available');
      return;
    }

    // choose worker port by round-robin
    const port = workerPorts[roundRobinIndex % workerPorts.length];
    roundRobinIndex++;

    const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);
    const opts = {
      hostname: '127.0.0.1',
      port,
      path: url.pathname + url.search,
      method: req.method,
      headers: req.headers,
    };

    const proxyReq = http.request(opts, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
      res.writeHead(502);
      res.end(`Bad gateway: ${err.message}`);
    });

    req.pipe(proxyReq, { end: true });
  });

  loadBalancerServer.listen(basePort, () => {
    console.log(`Load balancer listening on port ${basePort}. Workers on ports: ${workerPorts.join(', ')}`);
  });

  const shutdown = () => {
    console.log('Primary shutting down...');
    loadBalancerServer.close();
    for (const id in cluster.workers) {
      cluster.workers[id]?.kill();
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

} else {
  (async () => {
    try {
      require('./index');

      if (process.send) {
        process.send({ type: 'requestState' });
      }
    } catch (err) {
      console.error('Worker start error:', err);
      process.exit(1);
    }
  })();
}
