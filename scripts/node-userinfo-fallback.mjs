import os from 'node:os';

if (process.argv.includes('--production')) {
  process.env.NODE_ENV = 'production';
}

const originalUserInfo = os.userInfo;
os.userInfo = function safeUserInfo(options) {
  try {
    return originalUserInfo.call(os, options);
  } catch (error) {
    if (!error || error.code !== 'ERR_SYSTEM_ERROR' || error.syscall !== 'uv_os_get_passwd') {
      throw error;
    }
    return {
      uid: -1,
      gid: -1,
      username: process.env.USERNAME || 'local-user',
      homedir: process.env.USERPROFILE || os.homedir(),
      shell: null,
    };
  }
};
