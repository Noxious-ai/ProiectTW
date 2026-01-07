import sequelize from "../sequelize.js";
import { DataTypes } from "sequelize";

const Professor = sequelize.define("professors", {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	name: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	email: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true,
	},
	maxStudents: {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 5,
	},
	password: {
		type: DataTypes.STRING,
		allowNull: true,
	},
});

export default Professor;
