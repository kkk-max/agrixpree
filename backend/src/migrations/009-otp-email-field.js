'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('otp_codes', 'email', {
      type: Sequelize.STRING(255),
      allowNull: true,
      after: 'id'
    });
    await queryInterface.changeColumn('otp_codes', 'mobile', {
      type: Sequelize.STRING(15),
      allowNull: true
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('otp_codes', 'email');
    await queryInterface.changeColumn('otp_codes', 'mobile', {
      type: Sequelize.STRING(15),
      allowNull: false
    });
  }
};
