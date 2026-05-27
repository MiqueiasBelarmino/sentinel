import pm2 from 'pm2';

function connectPm2(): Promise<void> {
  return new Promise((resolve, reject) => {
    pm2.connect((err) => {
      if (err) reject(new Error(`PM2 connect: ${err.message}`));
      else resolve();
    });
  });
}

export function pm2List(): Promise<pm2.ProcessDescription[]> {
  return new Promise(async (resolve, reject) => {
    try {
      await connectPm2();
      pm2.list((err, list) => {
        pm2.disconnect();
        if (err) reject(err);
        else resolve(list);
      });
    } catch (e) {
      reject(e);
    }
  });
}

export function pm2Describe(id: string): Promise<pm2.ProcessDescription[]> {
  return new Promise(async (resolve, reject) => {
    try {
      await connectPm2();
      pm2.describe(id, (err, desc) => {
        pm2.disconnect();
        if (err) reject(err);
        else resolve(desc);
      });
    } catch (e) {
      reject(e);
    }
  });
}

export function pm2Restart(id: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      await connectPm2();
      pm2.restart(id, (err) => {
        pm2.disconnect();
        if (err) reject(err);
        else resolve();
      });
    } catch (e) {
      reject(e);
    }
  });
}
