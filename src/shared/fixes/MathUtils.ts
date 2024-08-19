export namespace MathUtils {
	export function round(value: number, step: number): number {
		if (step === 0) {
			return value;
		}

		const halfstep = step / 2;
		return value - ((value + halfstep) % step) + halfstep;
	}
	export function roundToString(value: number, step: number): number {
		if (step === 0) {
			return value;
		}

		const halfstep = step / 2;
		return value - ((value + halfstep) % step) + halfstep;
	}
}
