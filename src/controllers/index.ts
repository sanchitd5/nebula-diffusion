import DemoBaseController from "./demoController/demoBaseController";
import UploadBaseController from "./uploadController/uploadBaseController";
import UserBaseController from "./userController/userBaseController";
import AdminBaseController from "./adminController/adminBaseController"; 

class Controllers {
  UserBaseController = UserBaseController;
  AdminBaseController = AdminBaseController;
  DemoBaseController = DemoBaseController;
  UploadBaseController = UploadBaseController;
}

export default new Controllers();
