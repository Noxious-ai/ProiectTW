import sequelize from "../sequelize.js";
import { DataTypes } from "sequelize";

const RequestDissertation = sequelize.define("requests", {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	status: {
		type: DataTypes.ENUM("pending", "approved", "rejected"),
		defaultValue: "pending",
	},
	title: {
		type: DataTypes.STRING,
		allowNull: true,
	},
	description: {
		type: DataTypes.TEXT,
		allowNull: true,
	},
	justification: {
		type: DataTypes.STRING,
		allowNull: true,
	},
	studentFile: {
		type: DataTypes.STRING,
		allowNull: true,
	},
	professorFile: {
		type: DataTypes.STRING,
		allowNull: true,
	},
	studentId: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
	professorId: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
	sessionId: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
});

export default RequestDissertation;
