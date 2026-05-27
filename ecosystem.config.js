// @ts-check
module.exports = {
  apps: [
    {
      name: 'sentinel-backend',
      // cwd aponta para o backend/ para que o dotenv encontre o .env corretamente
      script: './dist/main.js',
      cwd: '/root/apps/sentinel/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 3333,
      },
    },
  ],
};
