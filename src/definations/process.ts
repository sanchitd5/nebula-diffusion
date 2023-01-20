export interface BaseEnvironment {
    readonly NODE_ENV: 'DEVELOPMENT' | 'PRODUCTION' | 'TEST';
    readonly APP_NAME: string;
    readonly HAPI_PORT: string;
    readonly JWT_SECRET_KEY: string;
}
