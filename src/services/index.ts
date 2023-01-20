import config from '../config';
import { DATABASE } from '../definations';
import { throwIfMongoDisabled, throwIfPostGresDisabled, throwIfMySQLDisabled } from '../utils';
import GenericMongoService from './genericServices/mongo';
import GenericSQLService from './genericServices/sql';

class Services {
  declare UserService?: GenericMongoService | GenericSQLService;
  declare AdminService?: GenericMongoService | GenericSQLService;
  constructor() {
    console.info('Initializing services');
    console.debug('User :' + config.APP_CONFIG.userDatabase);
    switch (config.APP_CONFIG.userDatabase) {
      case DATABASE.MONGODB:
        throwIfMongoDisabled();
        this.UserService = new GenericMongoService('User');
        break;
      case DATABASE.POSTGRES:
        throwIfPostGresDisabled();
        this.UserService = new GenericSQLService('User');
        break;
      case DATABASE.MYSQL:
        throwIfMySQLDisabled();
        break;
      default:
      // none
    }
    console.debug('Admin :' + config.APP_CONFIG.adminDatabase);
    switch (config.APP_CONFIG.adminDatabase) {
      case DATABASE.MONGODB:
        this.AdminService = new GenericMongoService('Admin');
        break;
      case DATABASE.POSTGRES:
        throwIfPostGresDisabled();
        break;
      // TBI
      case DATABASE.MYSQL:
        throwIfMySQLDisabled();
        break;
      default:
      // none
    }
  }

  ForgetPasswordService = new GenericMongoService('ForgetPassword');
  TokenService = new GenericMongoService('Token');
}


export default new Services();