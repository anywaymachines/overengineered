export default class RobloxUnit {
	static Studs_To_Meters(Studs: number) {
		return Studs * 0.28;
	}

	/** BasePart.Mass */
	static RMU_To_Kilograms(Mass: number) {
		return Mass * 21.952;
	}

	/** Magnitude => meter/second */
	static getSpeedFromMagnitude(magnitude: number, unit: "MetersPerSecond" | "Knots" = "MetersPerSecond") {
		if (unit === "MetersPerSecond") {
			return magnitude / 3.57;
		} else if (unit === "Knots") {
			return (magnitude / 3.57) * 1.944;
		} else {
			return magnitude;
		}
	}

	/** VectorForce.Force */
	static Rowton_To_Newton(Force: number) {
		return Force / 0.163;
	}

	/** Torque.Torque */
	static RowtonStuds_To_NewtonMeters(RowtonStuds: number) {
		return RowtonStuds / 0.581;
	}

	static SpringStiffnes_To_NewtonOnMeters(Stiffnes: number) {
		return Stiffnes / 0.0456;
	}

	static SprintDumping_To_NewtonSecondOnMeter(Dumping: number) {
		return Dumping / 0.0456;
	}
}
