export default function softDeletePlugin(schema) {
  const excludeDeleted = function (next) {
    // If the query already specifies an isDeleted condition, don't override it.
    // This allows admin endpoints to query { isDeleted: true } or { isDeleted: false } explicitly.
    const query = this.getQuery();
    if (query.isDeleted === undefined) {
      this.where({ isDeleted: { $ne: true } });
    }
    next();
  };

  schema.pre('find', excludeDeleted);
  schema.pre('findOne', excludeDeleted);
  schema.pre('findOneAndUpdate', excludeDeleted);
  schema.pre('countDocuments', excludeDeleted);

  // For aggregation pipelines
  schema.pre('aggregate', function (next) {
    const pipeline = this.pipeline();
    const firstStage = pipeline[0];
    
    // If the first stage already matches on isDeleted, we skip
    if (firstStage && firstStage.$match && firstStage.$match.hasOwnProperty('isDeleted')) {
      return next();
    }
    
    // Otherwise inject the match at the beginning of the pipeline
    pipeline.unshift({ $match: { isDeleted: { $ne: true } } });
    next();
  });
}
