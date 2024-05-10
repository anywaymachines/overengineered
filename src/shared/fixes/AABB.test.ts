import { Assert } from "shared/Assert";
import { AABB } from "shared/fixes/AABB";

export namespace _Tests {
	export namespace AABBTests {
		function vec3(x: number, y: number, z: number) {
			return new Vector3(x, y, z);
		}

		export function isInsideOf() {
			Assert.isTrue(
				AABB.fromMinMax(vec3(0, 0, 0), vec3(3, 3, 3)).contains(AABB.fromMinMax(vec3(1, 1, 1), vec3(2, 2, 2))),
			);
			Assert.isTrue(
				AABB.fromMinMax(vec3(0, 0, 0), vec3(3, 3, 3)).contains(AABB.fromMinMax(vec3(0, 0, 0), vec3(3, 3, 3))),
			);
			Assert.isFalse(
				AABB.fromMinMax(vec3(0, 0, 0), vec3(3, 3, 3)).contains(AABB.fromMinMax(vec3(1, 1, 1), vec3(2, 2, 4))),
			);
			Assert.isFalse(
				AABB.fromMinMax(vec3(1, 1, 1), vec3(2, 2, 2)).contains(AABB.fromMinMax(vec3(0, 0, 0), vec3(3, 3, 3))),
			);

			Assert.isTrue(AABB.fromMinMax(vec3(0, 0, 0), vec3(3, 3, 3)).contains(vec3(1, 1, 1)));
			Assert.isTrue(AABB.fromMinMax(vec3(0, 0, 0), vec3(3, 3, 3)).contains(vec3(0, 0, 0)));
			Assert.isFalse(AABB.fromMinMax(vec3(0, 0, 0), vec3(3, 3, 3)).contains(vec3(1, 1, 4)));
		}
	}
}
