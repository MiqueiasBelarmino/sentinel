// @ts-check
module.exports = {
  apps: [
    {
      name: 'sentinel-backend',
      script: './backend/dist/main.js',
      cwd: '/root/apps/sentinel',
      env: {
        NODE_ENV: 'production',
        PORT: 3333,
      },
    },
  ],
};
