/**
 * Wrapper for async controller functions to catch errors and pass them to the global error handler
 * @param {Function} fn - The async function to wrap
 * @returns {Function} - Express middleware function
 */
export const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
