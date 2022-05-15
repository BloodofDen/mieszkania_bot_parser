import { UserController } from './UserController';

class Controller {
  readonly user = new UserController();
}

export const controller = new Controller();
