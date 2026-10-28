import { Repository } from "./repository.js";
import messagesModel from "../Models/messages.model.js";

class MessagesRepository extends Repository {
  constructor() {
    super(messagesModel);
  }

  findByReceiver(receiverId, { page = 1, limit = 20 } = {}) {
    return this.model
      .find({ receiverId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
  }
}

export default new MessagesRepository();
