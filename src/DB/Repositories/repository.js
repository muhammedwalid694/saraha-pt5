/**
 * Generic base Repository.
 *
 * Services should never call a Mongoose model directly — they go
 * through a Repository instead. That keeps all DB/Mongoose-specific
 * code (queries, population, lean, etc.) in one layer, so the
 * service layer only talks in plain "business" method calls and the
 * underlying model/DB technology could be swapped out later without
 * touching the services.
 */
export class Repository {
  constructor(model) {
    this.model = model;
  }

  create(data) {
    return this.model.create(data);
  }

  findOne(filter = {}, projection = null, options = {}) {
    return this.model.findOne(filter, projection, options);
  }

  findById(id, projection = null, options = {}) {
    return this.model.findById(id, projection, options);
  }

  find(filter = {}, projection = null, options = {}) {
    return this.model.find(filter, projection, options);
  }

  findByIdAndUpdate(id, data, options = { new: true }) {
    return this.model.findByIdAndUpdate(id, data, options);
  }

  findOneAndUpdate(filter, data, options = { new: true }) {
    return this.model.findOneAndUpdate(filter, data, options);
  }

  findByIdAndDelete(id) {
    return this.model.findByIdAndDelete(id);
  }

  findOneAndDelete(filter) {
    return this.model.findOneAndDelete(filter);
  }

  deleteMany(filter) {
    return this.model.deleteMany(filter);
  }

  countDocuments(filter = {}) {
    return this.model.countDocuments(filter);
  }
}
