/**
 * Created by Sanchit
 */
import User from './user';
import Admin from './admin';
import Token from './token';
import ForgetPassword from './forgotPasswordRequest';

const models: { [key: string]: any } = {
  User,
  ForgetPassword,
  Admin,
  Token
};

export default models;