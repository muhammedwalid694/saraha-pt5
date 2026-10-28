import { Repository } from "./repository.js";
import userModel from "../Models/user.model.js";

class UserRepository extends Repository {
  constructor() {
    super(userModel);
  }

  findByEmail(email, provider) {
    return this.model.findOne({ email, ...(provider && { provider }) });
  }

  findByGoogleSub(sub, provider) {
    return this.model.findOne({ GoogleSub: sub, provider });
  }
}

// A single shared instance is enough — the underlying Mongoose model
// is already a singleton per app, so the repository can be too.
export default new UserRepository();
