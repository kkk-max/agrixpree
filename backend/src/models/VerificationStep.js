const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('VerificationStep', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    step_number: { type: DataTypes.TINYINT, allowNull: false },
    step_name: { type: DataTypes.STRING(100), allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'submitted', 'approved', 'rejected'), defaultValue: 'pending' },
    reviewed_by: DataTypes.INTEGER.UNSIGNED,
    review_notes: DataTypes.TEXT,
    submitted_at: DataTypes.DATE,
    reviewed_at: DataTypes.DATE
  }, {
    tableName: 'verification_steps',
    underscored: true,
    indexes: [{ unique: true, fields: ['user_id', 'step_number'] }]
  });
};
