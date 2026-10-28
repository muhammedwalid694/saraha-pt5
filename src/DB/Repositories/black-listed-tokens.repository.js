import { Repository } from "./repository.js";
import blackListedTokensModel from "../Models/black-listed-tokens.model.js";

class BlackListedTokensRepository extends Repository {
  constructor() {
    super(blackListedTokensModel);
  }

  findByTokenId(tokenId) {
    return this.model.findOne({ tokenId });
  }
}

export default new BlackListedTokensRepository();
