const CronScheduler = require('../services/cronScheduler');

async function startScheduler() {
  console.log('🤖 Starting JobTool Cron Scheduler');
  console.log('📅 Configured to run daily at 4:00 PM CDT');
  console.log('🔄 Press Ctrl+C to stop\n');

  const scheduler = new CronScheduler();

  try {
    await scheduler.start();
    
    // Keep the process running
    console.log('✅ Scheduler is running...');
    console.log('📋 Status:', scheduler.getStatus());
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Received SIGINT, shutting down gracefully...');
      scheduler.stop();
      await scheduler.scraper.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
      scheduler.stop();
      await scheduler.scraper.close();
      process.exit(0);
    });

    // Optional: Add a manual trigger endpoint for testing
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('\n💡 Commands:');
    console.log('   "run" - Manually trigger scraper');
    console.log('   "status" - Show scheduler status');
    console.log('   "quit" - Exit scheduler\n');

    rl.on('line', async (input) => {
      const command = input.trim().toLowerCase();
      
      switch (command) {
        case 'run':
          console.log('🔧 Running manual scrape...');
          await scheduler.runManualScrape();
          break;
        case 'status':
          console.log('📋 Status:', scheduler.getStatus());
          break;
        case 'quit':
        case 'exit':
          console.log('👋 Goodbye!');
          rl.close();
          process.exit(0);
          break;
        default:
          console.log('❓ Unknown command. Try: run, status, quit');
      }
    });

  } catch (error) {
    console.error('❌ Failed to start scheduler:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startScheduler();
}

module.exports = startScheduler;