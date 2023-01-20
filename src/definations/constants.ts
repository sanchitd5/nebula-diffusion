export interface DeviceTypes {
    readonly IOS: string;
    readonly ANDROID: string;
    readonly WEB: string;
    readonly WINDOWS: string;
    readonly LINUX: string;
    readonly MAC: string;
}

export interface UserRoles {
    readonly USER: string;
    readonly SUPERADMIN: string;
    readonly ADMIN: string;
}

export interface DatabaseConstants {
    readonly DEVICE_TYPES: DeviceTypes;
    readonly USER_ROLES: UserRoles;
}

export interface FrozenResponseMessage {
    readonly statusCode: number,
    readonly customMessage: string;
    readonly type: string; 
}

export interface ErrorMessages {
    readonly DEFAULT: FrozenResponseMessage;
    readonly APP_ERROR: FrozenResponseMessage;
    readonly DB_ERROR: FrozenResponseMessage;
    readonly INVALID_ID: FrozenResponseMessage;
    readonly DUPLICATE: FrozenResponseMessage;
    readonly USER_ALREADY_REGISTERED: FrozenResponseMessage;
    readonly FACEBOOK_ID_PASSWORD_ERROR: FrozenResponseMessage;
    readonly PASSWORD_REQUIRED: FrozenResponseMessage;
    readonly INVALID_COUNTRY_CODE: FrozenResponseMessage;
    readonly INVALID_PHONE_NO_FORMAT: FrozenResponseMessage;
    readonly IMP_ERROR: FrozenResponseMessage;
    readonly UNIQUE_CODE_LIMIT_REACHED: FrozenResponseMessage;
    readonly PHONE_NO_EXIST: FrozenResponseMessage;
    readonly EMAIL_NO_EXIST: FrozenResponseMessage;
    readonly USERNAME_EXIST: FrozenResponseMessage;
    readonly INVALID_TOKEN: FrozenResponseMessage;
    readonly INCORRECT_ACCESSTOKEN: FrozenResponseMessage;
    readonly INVALID_CODE: FrozenResponseMessage;
    readonly USER_NOT_FOUND: FrozenResponseMessage;
    readonly INCORRECT_PASSWORD: FrozenResponseMessage;
    readonly ACCOUNT_BLOCKED: FrozenResponseMessage;
    readonly PRIVILEGE_MISMATCH: FrozenResponseMessage;
    readonly NOT_REGISTERED: FrozenResponseMessage;
    readonly FACEBOOK_ID_NOT_FOUND: FrozenResponseMessage;
    readonly PHONE_VERIFICATION_COMPLETE: FrozenResponseMessage;
    readonly EMAIL_VERIFICATION_COMPLETE: FrozenResponseMessage;
    readonly OTP_CODE_NOT_FOUND: FrozenResponseMessage;
    readonly NOT_FOUND: FrozenResponseMessage;
    readonly WRONG_PASSWORD: FrozenResponseMessage;
    readonly NOT_UPDATE: FrozenResponseMessage;
    readonly PASSWORD_CHANGE_REQUEST_INVALID: FrozenResponseMessage;
    readonly USER_NOT_REGISTERED: FrozenResponseMessage;
    readonly PHONE_VERIFICATION: FrozenResponseMessage;
    readonly INCORRECT_ID: FrozenResponseMessage;
    readonly NOT_VERFIFIED: FrozenResponseMessage;
    readonly PASSWORD_CHANGE_REQUEST_EXPIRE: FrozenResponseMessage;
    readonly INVALID_EMAIL_FORMAT: FrozenResponseMessage;
}

export interface SuccessMessages {
    readonly DEFAULT: FrozenResponseMessage;
    readonly CREATED: FrozenResponseMessage;
    readonly VERIFY_COMPLETE: FrozenResponseMessage;
    readonly VERIFY_SENT: FrozenResponseMessage;
    readonly LOGOUT: FrozenResponseMessage;
    readonly PASSWORD_RESET: FrozenResponseMessage;
}

export interface StatusMessages {
    readonly ERROR: ErrorMessages;
    readonly SUCCESS: SuccessMessages;
}

export interface TimeUnits {
    readonly SECONDS: string;
    readonly MINUTES: string;
    readonly HOURS: string;
    readonly DAYS: string;
    readonly WEEKS: string;
    readonly MONTHS: string;
}

export interface SwaaggerResponseMessage {
    readonly code: number;
    readonly message: string;
}