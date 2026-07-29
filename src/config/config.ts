import path from 'path';


const ROOT_PATH = path.join(__dirname, '..', '..');

process.loadEnvFile(path.join(ROOT_PATH, '.env'));

function resolveFromProjectRoot(relativeOrAbsolute: string): string {
    return path.isAbsolute(relativeOrAbsolute) ? relativeOrAbsolute : path.join(ROOT_PATH, relativeOrAbsolute);
}

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

        // Accepts either an absolute path or a path relative to the project
        // root — see resolveFromProjectRoot() above.
        policyTemplatePath: resolveFromProjectRoot(process.env.POLICY_TEMPLATE_PATH || 'templates/redis/policy.json'),
    },

    worker: {
        iterations: Number(process.env.ITERATIONS || 100),
    },
};

export default config;
