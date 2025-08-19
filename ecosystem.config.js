module.exports = {
  apps: [
    {
      name: 'jobtool-server',
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'jobtool-scheduler',
      script: 'scripts/startScheduler.js',
      env: {
        NODE_ENV: 'production'
      },
      restart_delay: 5000,
      max_restarts: 5,
      min_uptime: '30s',
      cron_restart: '0 0 * * *' // Restart daily at midnight to prevent memory leaks
    },
    {
      name: 'jobtool-email-monitor',
      script: 'scripts/startEmailMonitor.js',
      env: {
        NODE_ENV: 'production'
      },
      restart_delay: 10000,
      max_restarts: 5,
      min_uptime: '1m',
      cron_restart: '0 */6 * * *' // Restart every 6 hours for fresh monitoring
    }
  ]
};