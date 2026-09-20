import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

async function main() {
  // Verify DB connection at startup
  try {
    await prisma.$connect();
    console.log('✅ Database connection established.');
  } catch (error) {
    console.error('❌ Database connection failed. Please check your DATABASE_URL in server/.env');
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

    // Force-exit after 10 seconds if requests don't finish
    const forceExit = setTimeout(() => {
      console.error('⚠️  Forced shutdown after timeout.');
      process.exit(1);
    }, 10_000);
    forceExit.unref();

    server.close(async () => {
      try {
        await prisma.$disconnect();
        console.log('✅ Server and database connections closed.');
      } catch {
        console.error('Error during Prisma disconnect.');
      } finally {
        process.exit(0);
      }
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    void shutdown('uncaughtException');
  });
}

main();
