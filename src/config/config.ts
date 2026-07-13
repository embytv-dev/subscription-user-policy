import 'dotenv/config';
import path from 'path';

const config = {
    env: process.env.NODE_ENV || 'development',
    debug: process.env.APP_DEBUG === 'true',

    mysql: {
        host: process.env.MYSQL_HOST || 'localhost',
        port: Number(process.env.MYSQL_PORT || 3306),
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        dbPortal: process.env.MYSQL_DB_PORTAL,
        dbEmby: process.env.MYSQL_DB_EMBY,
    },

    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT || 6379),
        password: process.env.REDIS_PASSWORD || undefined,
    },

    publish: {
        serverId: process.env.PUBLISH_SERVER_ID,
        channel: 'OnUserPolicyUpdated',
        policyTemplatePath:
            process.env.POLICY_TEMPLATE_PATH || path.join(process.cwd(), 'templates/redis/policy.json'),
    },

    worker: {
        iterations: Number(process.env.ITERATIONS || 100),
    },
};

export default config;
