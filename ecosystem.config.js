module.exports = {
  apps: [
    {
      name: 'ecommerce-app',
      script: './app.js',
      instances: 'max', // Uses all available CPU cores for clustering
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      error_file: './logs/error.log',
      out_file: './logs/output.log',
      merge_logs: true,
      time: true,
    },
  ],
};
