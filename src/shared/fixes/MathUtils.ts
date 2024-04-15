export namespace MathUtils {
	export function round(value: number, step: number): number {
		const halfstep = step / 2;
		return value - ((value + halfstep) % step) + halfstep;
	}
	export function roundToString(value: number, step: number): number {
		const halfstep = step / 2;
		return value - ((value + halfstep) % step) + halfstep;
	}
}
