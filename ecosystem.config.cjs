module.exports = {
  apps: [
    {
      name: 'vms-kota-madiun',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: __dirname,

      // Restart otomatis hanya jika crash (bukan exit normal)
      autorestart: true,
      watch: false,
      max_restarts: 5,
      restart_delay: 3000,

      // Environment production
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Log output
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
  ],
};
