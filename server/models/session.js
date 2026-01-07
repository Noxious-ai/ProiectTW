import sequelize from "../sequelize.js";
import { DataTypes } from "sequelize";

const Session = sequelize.define("sessions", {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	startDate: {
		type: DataTypes.DATE,
		allowNull: false,
	},
	endDate: {
		type: DataTypes.DATE,
		allowNull: false,
	},
	professorId: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
});

export default Session;
