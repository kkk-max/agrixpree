const { Pincode } = require('../../models');

// Public list — only pincodes the admin has switched on are serviceable.
const getActivePincodes = async () => {
  return Pincode.findAll({
    where: { is_active: true },
    attributes: ['id', 'pincode', 'area'],
    order: [['pincode', 'ASC']]
  });
};

module.exports = { getActivePincodes };
