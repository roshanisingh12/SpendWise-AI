import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

async function main() {
  // Verify DB connection
  try {
    // await prisma.$connect();
    console.log('✅ Database connection test bypassed for local dev.');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('Please check your DATABASE_URL in server/.env');
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    console.log(`
  🚀 Spendwise AI API is running
  ─────────────────────────────
  Environment: ${env.NODE_ENV}
  Port:        ${env.PORT}
  API Base:    http://localhost:${env.PORT}/api
  Health:      http://localhost:${env.PORT}/api/health
  Client URL:  ${env.CLIENT_URL}
  ─────────────────────────────
    `);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n⚠️  Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log('✅ Server and database connections closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
  });
}

main();
