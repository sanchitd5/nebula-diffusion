import Hapi from '@hapi/hapi';
import DemoBaseRoute from "./demoRoute/demoBaseRoute";
import UserBaseRoute from "./userRoute/userBaseRoute";
import AdminBaseRoute from "./adminRoute/adminBaseRoute";
import UploadBaseRoute from "./uploadRoute/uploadBaseRoute";
import config from '../config';
import { DATABASE } from '../definations';

const routes: Hapi.ServerRoute[] = [...DemoBaseRoute, ...UploadBaseRoute];

(() => {
    if (config.APP_CONFIG.userDatabase !== DATABASE.NONE) {
        routes.push(...UserBaseRoute);
    }
    if (config.APP_CONFIG.adminDatabase !== DATABASE.NONE) {
        routes.push(...AdminBaseRoute);
    }
})();

export default routes;
