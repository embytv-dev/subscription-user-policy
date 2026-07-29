const path = require('path');
process.loadEnvFile(path.join(__dirname, '.env'));

module.exports = {
    apps: [
        {
            name: `subscription-user-policy`,
            script: 'dist/main.js',
            args: '10',
            interpreter_args: '--max_old_space_size=4000',
            cwd: __dirname,
            instances: 1,
            exec_mode: 'fork',
            watch: false,
            autorestart: true,
            restart_delay: 300 * 1000, //  sec
            log_date_format: 'YYYY-MM-DD HH:mm:ss.SSSS Z',
        },
    ],
};
