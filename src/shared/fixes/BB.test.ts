import { Players, Workspace } from "@rbxts/services";
import { Assert } from "shared/Assert";
import { Colors } from "shared/Colors";
import { Element } from "shared/Element";
import { BB } from "shared/fixes/BB";

const parent = Element.create("Folder", { Name: "BBtests", Parent: Workspace });

export namespace _Tests {
	export namespace BBTests {
		function cf(x: number, y: number, z: number) {
			return new CFrame(x, y, z);
		}
		function vec3(x: number, y: number, z: number) {
			return new Vector3(x, y, z);
		}

		export function isInside() {
			Assert.isTrue(new BB(cf(1, 1, 1), vec3(2, 2, 2)).isPointInside(vec3(1, 1, 1)));
			Assert.isTrue(new BB(cf(1, 1, 1), vec3(2, 2, 2)).isPointInside(vec3(0, 0, 0)));
			Assert.isTrue(new BB(cf(1, 1, 1), vec3(2, 2, 2)).isPointInside(vec3(2, 2, 2)));
			Assert.isFalse(new BB(cf(1, 1, 1), vec3(2, 2, 2)).isPointInside(vec3(-2, -2, -2)));

			Assert.isTrue(new BB(cf(1, 1, 1), vec3(2, 2, 2)).isBBInside(new BB(cf(1, 1, 1), vec3(1, 1, 1))), "12 11");
			Assert.isTrue(new BB(cf(1, 1, 1), vec3(2, 2, 2)).isBBInside(new BB(cf(1, 1, 1), vec3(2, 2, 2))), "12 12");
			Assert.isFalse(new BB(cf(1, 1, 1), vec3(2, 2, 2)).isBBInside(new BB(cf(1, 1, 1), vec3(3, 3, 3))), "12 13");
		}
		export function isInsideVisual() {
			const check = (check: boolean, add: number, bb1: BB, bb2: BB, message?: string) => {
				visualizePart(
					bb1.withCenter((c) =>
						Players.LocalPlayer.Character!.GetPivot()
							.mul(c)
							.add(vec3(add, 0, 0)),
					),
				);
				visualizePart(
					bb2.withCenter((c) =>
						Players.LocalPlayer.Character!.GetPivot()
							.mul(c)
							.add(vec3(add, 0, 0)),
					),
				);
				Assert.equals(bb1.isBBInside(bb2), check, message);
			};

			Assert.isTrue(new BB(cf(1, 1, 1), vec3(2, 2, 2)).isPointInside(vec3(1, 1, 1)));
			Assert.isTrue(new BB(cf(1, 1, 1), vec3(2, 2, 2)).isPointInside(vec3(0, 0, 0)));
			Assert.isTrue(new BB(cf(1, 1, 1), vec3(2, 2, 2)).isPointInside(vec3(2, 2, 2)));
			Assert.isFalse(new BB(cf(1, 1, 1), vec3(2, 2, 2)).isPointInside(vec3(-2, -2, -2)));

			check(
				false,
				0,
				new BB(cf(1, 1, 1), vec3(1, 2, 1)),
				new BB(cf(1, 1, 1).mul(CFrame.Angles(math.rad(90), 0, 0)), vec3(1, 2, 1)),
				"12 11",
			);
			check(true, 4, new BB(cf(1, 1, 1), vec3(2, 2, 2)), new BB(cf(1, 1, 1), vec3(2, 2, 2)), "12 12");
			check(false, 8, new BB(cf(1, 1, 1), vec3(2, 2, 2)), new BB(cf(1, 1, 1), vec3(3, 3, 3)), "12 13");
		}

		function visualizePart(bb: BB) {
			const bbOriginal = Element.create("Part", {
				Anchored: true,
				Transparency: 1,
				Name: "BB_os",
				Size: bb.originalSize,
				CFrame: bb.center,
				Parent: parent,
			});
			Element.create("SelectionBox", {
				Parent: bbOriginal,
				Adornee: bbOriginal,
				Color3: Colors.green,
				LineThickness: 0.05,
			});

			const bbRotated = Element.create("Part", {
				Anchored: true,
				Transparency: 1,
				Name: "BB_ro",
				Size: bb.getRotatedSize(),
				Position: bb.center.Position,
				Parent: parent,
			});
			Element.create("SelectionBox", {
				Parent: bbRotated,
				Adornee: bbRotated,
				Color3: Colors.red,
				LineThickness: 0.05,
			});
		}

		export function visualize() {
			const part = Element.create("Part", {
				Anchored: true,
				Size: new Vector3(1, 1, 4),
				CFrame: Players.LocalPlayer.Character!.GetPivot(),
				Rotation: new Vector3(math.rad(90), 0, 0),
				Parent: parent,
			});

			visualizePart(BB.fromPart(part));
		}

		export function cleanup() {
			parent.ClearAllChildren();
		}
	}
}
