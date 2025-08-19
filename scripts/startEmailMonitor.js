const { EmailMonitor } = require('../services/emailMonitor');
const { JobLogger } = require('../services/jobLogger');

const logger = new JobLogger('email_monitor_startup');

async function startEmailMonitor() {
  try {
    logger.log('Starting email monitoring service...');
    
    const emailMonitor = new EmailMonitor();
    
    // Start the email monitor
    await emailMonitor.start();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.log('Received SIGINT, shutting down email monitor...');
      await emailMonitor.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logger.log('Received SIGTERM, shutting down email monitor...');
      await emailMonitor.stop();
      process.exit(0);
    });
    
    process.on('uncaughtException', async (error) => {
      logger.error('Uncaught exception in email monitor:', error);
      await emailMonitor.stop();
      process.exit(1);
    });
    
    process.on('unhandledRejection', async (reason, promise) => {
      logger.error('Unhandled rejection in email monitor:', reason);
      await emailMonitor.stop();
      process.exit(1);
    });
    
    logger.log('Email monitoring service started successfully');
    
    // Keep the process running
    setInterval(() => {
      const status = emailMonitor.getStatus();
      logger.log('Email monitor heartbeat', status);
    }, 60 * 60 * 1000); // Log heartbeat every hour
    
  } catch (error) {
    logger.error('Failed to start email monitoring service:', error);
    process.exit(1);
  }
}

// Start the service
startEmailMonitor();