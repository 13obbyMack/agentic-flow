// Health check endpoint
import http from 'http';
import { logger } from './utils/logger.js';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    api: { status: 'pass' | 'fail'; message?: string };
    memory: { status: 'pass' | 'warn' | 'fail'; usage: number; limit: number };
  };
}

let serverStartTime = Date.now();

export function getHealthStatus(): HealthStatus {
  const memUsage = process.memoryUsage();
  const memLimit = 512 * 1024 * 1024; // 512MB
  const memPercent = (memUsage.heapUsed / memLimit) * 100;

  const apiKey = process.env.ANTHROPIC_API_KEY;

  return {
    status: memPercent > 90 ? 'unhealthy' : memPercent > 75 ? 'degraded' : 'healthy',
    timestamp: new Date().toISOString(),
    uptime: (Date.now() - serverStartTime) / 1000,
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      api: {
        status: apiKey && apiKey.startsWith('sk-ant-') ? 'pass' : 'fail',
        message: apiKey ? undefined : 'ANTHROPIC_API_KEY not configured'
      },
      memory: {
        status: memPercent > 90 ? 'fail' : memPercent > 75 ? 'warn' : 'pass',
        usage: Math.round(memUsage.heapUsed / 1024 / 1024),
        limit: Math.round(memLimit / 1024 / 1024)
      }
    }
  };
}

export function startHealthServer(port: number = 8080): http.Server {
  const server = http.createServer((req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
      const health = getHealthStatus();
      const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(health, null, 2));

      logger.debug('Health check requested', { status: health.status });
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  });

  server.listen(port, () => {
    logger.info('Health check server started', { port });
  });

  return server;
}
