const Joi = require('joi');

const createProduct = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  categoryId: Joi.number().integer().positive().required(),
  description: Joi.string().max(2000).optional().allow(''),
  unit: Joi.string().valid('kg', 'quintal', 'ton', 'piece', 'dozen', 'crate').required(),
  pricePerUnit: Joi.number().positive().required(),
  availableQuantity: Joi.number().min(0).required(),
  minimumOrderQty: Joi.number().positive().default(1),
  isDraft: Joi.boolean().default(false),
  expectedHarvestDate: Joi.when('isDraft', { is: true, then: Joi.date().iso().required(), otherwise: Joi.date().iso().optional() }),
  sowingDate: Joi.date().iso().optional().allow('', null),
  draftNotes: Joi.string().optional().allow('', null),
  originState: Joi.string().max(100).optional().allow('', null),
  originDistrict: Joi.string().max(100).optional().allow('', null),
  isOrganic: Joi.boolean().default(false),
  shelfLifeDays: Joi.number().integer().positive().optional().allow(null)
});

const updateProduct = Joi.object({
  name: Joi.string().min(2).max(200).optional(),
  categoryId: Joi.number().integer().positive().optional(),
  description: Joi.string().max(2000).optional().allow(''),
  unit: Joi.string().valid('kg', 'quintal', 'ton', 'piece', 'dozen', 'crate').optional(),
  pricePerUnit: Joi.number().positive().optional(),
  availableQuantity: Joi.number().min(0).optional(),
  minimumOrderQty: Joi.number().positive().optional(),
  isDraft: Joi.boolean().optional(),
  expectedHarvestDate: Joi.date().iso().optional().allow(null),
  sowingDate: Joi.date().iso().optional().allow(null),
  draftNotes: Joi.string().optional().allow('', null),
  originState: Joi.string().max(100).optional().allow('', null),
  originDistrict: Joi.string().max(100).optional().allow('', null),
  isOrganic: Joi.boolean().optional(),
  shelfLifeDays: Joi.number().integer().positive().optional().allow(null),
  status: Joi.string().valid('active', 'archived', 'out_of_stock').optional()
});

const updateStock = Joi.object({
  availableQuantity: Joi.number().min(0).required(),
  reason: Joi.string().optional().allow('', null)
});

module.exports = { createProduct, updateProduct, updateStock };
