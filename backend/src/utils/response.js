const sendSuccess = (res, data = null, message = 'Success', statusCode = 200, pagination = null) => {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  if (pagination) body.pagination = pagination;
  return res.status(statusCode).json(body);
};

const sendError = (res, message = 'Error', code = 'INTERNAL_ERROR', statusCode = 500, details = null) => {
  const body = { success: false, error: { code, message } };
  if (details) body.error.details = details;
  return res.status(statusCode).json(body);
};

module.exports = { sendSuccess, sendError };
