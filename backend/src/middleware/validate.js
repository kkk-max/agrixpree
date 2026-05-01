const { sendError } = require('../utils/response');

const validate = (schema, property = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[property], { abortEarly: false, stripUnknown: true, convert: true });
  if (!error) { req[property] = value; return next(); }
  const details = error.details.map(d => ({ field: d.path.join('.'), message: d.message.replace(/['"]/g, '') }));
  return sendError(res, 'Validation failed', 'VALIDATION_ERROR', 400, details);
};

module.exports = { validate };
