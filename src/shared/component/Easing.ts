import { TweenService } from "@rbxts/services";

export type EasingStyle = Enum.EasingStyle["Name"] | ((value: number) => number);
export type EasingDirection = Enum.EasingDirection["Name"];
export type Easable = number | UDim2 | Color3 | Vector2 | Vector3;

export namespace Easing {
	export function ease(value: number, easing: EasingStyle, direction: EasingDirection) {
		if (typeIs(easing, "function")) {
			if (direction === "In") {
				return easing(value);
			}
			if (direction === "Out") {
				return 1 - easing(1 - value);
			}
			if (direction === "InOut") {
				const val = easing(value > 0.5 ? 1 - value : value);
				return value > 0.2 ? 1 - val : val;
			}

			throw `Unknown direction ${direction}`;
		}

		return TweenService.GetValue(value, easing, direction);
	}

	export function easeValue<T extends Easable>(
		alpha: number,
		from: T,
		to: T,
		easing: EasingStyle,
		direction: EasingDirection,
	): T {
		const interpolate = <T extends Easable>(from: T, to: T): T => {
			if (typeIs(from, "number") && typeIs(to, "number")) {
				return (from + (to - from) * alpha) as T;
			}

			if (typeIs(from, "UDim2") && typeIs(to, "UDim2")) {
				return new UDim2(
					interpolate(from.X.Scale, to.X.Scale),
					interpolate(from.X.Offset, to.X.Offset),
					interpolate(from.Y.Scale, to.Y.Scale),
					interpolate(from.Y.Offset, to.Y.Offset),
				) as T;
			}

			if (typeIs(from, "Color3") && typeIs(to, "Color3")) {
				return new Color3(interpolate(from.R, to.R), interpolate(from.G, to.G), interpolate(from.B, to.B)) as T;
			}

			if (typeIs(from, "Vector2") && typeIs(to, "Vector2")) {
				return new Vector2(interpolate(from.X, to.X), interpolate(from.Y, to.Y)) as T;
			}

			if (typeIs(from, "Vector3") && typeIs(to, "Vector3")) {
				return new Vector3(
					interpolate(from.X, to.X),
					interpolate(from.Y, to.Y),
					interpolate(from.Z, to.Z),
				) as T;
			}

			throw `Untweenable type ${typeOf(from)}`;
		};

		alpha = Easing.ease(alpha, easing, direction);
		return interpolate(from, to);
	}
}
