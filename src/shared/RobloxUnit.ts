export namespace RobloxUnit {
	export function Studs_To_Meters(Studs: number) {
		return Studs * 0.28;
	}

	export function Meters_To_Studs(Meters: number) {
		return Meters / 0.28;
	}

	/** BasePart.Mass */
	export function RMU_To_Kilograms(Mass: number) {
		return Mass * 21.952;
	}

	/** Magnitude => meter/second */
	export function getSpeedFromMagnitude(magnitude: number, unit: "MetersPerSecond" | "Knots" = "MetersPerSecond") {
		if (unit === "MetersPerSecond") return magnitude / 3.57;
		if (unit === "Knots") return (magnitude / 3.57) * 1.944;
		return magnitude;
	}

	/** VectorForce.Force */
	export function Rowton_To_Newton(Force: number) {
		return Force / 0.163;
	}

	export function Newton_To_Rowton(Force: number) {
		return Force * 0.163;
	}

	/** Torque.Torque */
	export function RowtonStuds_To_NewtonMeters(RowtonStuds: number) {
		return RowtonStuds / 0.581;
	}

	export function SpringStiffnes_To_NewtonOnMeters(Stiffnes: number) {
		return Stiffnes / 0.0456;
	}

	export function SpringDumping_To_NewtonSecondOnMeter(Dumping: number) {
		return Dumping / 0.0456;
	}
}
