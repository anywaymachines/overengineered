import { Assert } from "client/test/Assert";
import { AABB } from "shared/fixes/AABB";

const vec3 = (x: number, y: number, z: number) => new Vector3(x, y, z);

export const AABBTests = {
	isInsideOf: () => {
		Assert.true(
			AABB.fromMinMax(vec3(0, 0, 0), vec3(3, 3, 3)).contains(AABB.fromMinMax(vec3(1, 1, 1), vec3(2, 2, 2))),
		);
		Assert.true(
			AABB.fromMinMax(vec3(0, 0, 0), vec3(3, 3, 3)).contains(AABB.fromMinMax(vec3(0, 0, 0), vec3(3, 3, 3))),
		);
		Assert.false(
			AABB.fromMinMax(vec3(0, 0, 0), vec3(3, 3, 3)).contains(AABB.fromMinMax(vec3(1, 1, 1), vec3(2, 2, 4))),
		);
		Assert.false(
			AABB.fromMinMax(vec3(1, 1, 1), vec3(2, 2, 2)).contains(AABB.fromMinMax(vec3(0, 0, 0), vec3(3, 3, 3))),
		);

		Assert.true(AABB.fromMinMax(vec3(0, 0, 0), vec3(3, 3, 3)).contains(vec3(1, 1, 1)));
		Assert.true(AABB.fromMinMax(vec3(0, 0, 0), vec3(3, 3, 3)).contains(vec3(0, 0, 0)));
		Assert.false(AABB.fromMinMax(vec3(0, 0, 0), vec3(3, 3, 3)).contains(vec3(1, 1, 4)));
	},
} as const;
