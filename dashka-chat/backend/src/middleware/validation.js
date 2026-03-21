const Joi = require('joi');
const logger = require('../utils/logger');

function validateTranslation(req, res, next) {
  const schema = Joi.object({
    text: Joi.string().required().min(1).max(5000),
    source_language: Joi.string().length(2).uppercase().optional(),
    target_language: Joi.string().length(2).uppercase().optional(),
    fromLang: Joi.string().length(2).uppercase().optional(),
    toLang: Joi.string().length(2).uppercase().optional(),
    from: Joi.string().length(2).uppercase().optional(),
    to: Joi.string().length(2).uppercase().optional()
  });

  const { error } = schema.validate(req.body);
  
  if (error) {
    logger.warn('Validation error:', error.details[0].message);
    return res.status(400).json({
      status: 'error',
      message: error.details[0].message
    });
  }
  
  next();
}

function validateLanguageDetection(req, res, next) {
  const schema = Joi.object({
    text: Joi.string().required().min(1).max(5000)
  });

  const { error } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      status: 'error',
      message: error.details[0].message
    });
  }
  
  next();
}

module.exports = {
  validateTranslation,
  validateLanguageDetection
};