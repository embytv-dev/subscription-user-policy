module.exports = {
    apps: [
        {
            name: `subscription-user-policy`,
            script: 'node',
            args: '--max_old_space_size=4000 dist/main.js importer',
            instances: 1,
            exec_mode: 'fork',
            watch: false,
            autorestart: true,
            restart_delay: 900 * 1000, //  sec
            log_date_format: 'YYYY-MM-DD HH:mm:ss.SSSS Z',
        },
    ],
};
