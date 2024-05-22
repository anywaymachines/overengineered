import { Workspace } from "@rbxts/services";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { Element } from "shared/Element";
import type { ChunkGenerator, ChunkRenderer } from "client/terrain/ChunkLoader";

const parent = Element.create("Folder", { Name: "Triterra", Parent: Workspace.WaitForChild("Obstacles") });
export const TriangleChunkRenderer = (
	generator: ChunkGenerator,
	chunkResolution: number = 8,
): ChunkRenderer<Instance> => {
	const chunkSize = 128 * 4;
	const squareSize = chunkSize / chunkResolution;
	const squareHalfSize = squareSize / 2;
	const thicccccness = 10;
	const half_thicccccness = thicccccness / 2;
	const errorAngle = 90;
	const newWedge = (size: Vector3, cframe: CFrame) => {
		const wedge = new Instance("WedgePart");
		wedge.Size = size;
		wedge.CFrame = cframe;
		wedge.Anchored = true;
		wedge.CastShadow = false;
		wedge.Locked = true;

		return wedge;
	};
	const createTriangle = (a: Vector3, b: Vector3, c: Vector3) => {
		let [ab, ac, bc] = [b.sub(a), c.sub(a), c.sub(b)];
		const [abd, acd, bcd] = [ab.Dot(ab), ac.Dot(ac), bc.Dot(bc)];

		if (abd > acd && abd > bcd) {
			[c, a] = [a, c];
		} else if (acd > bcd && acd > abd) {
			[a, b] = [b, a];
		}

		[ab, ac, bc] = [b.sub(a), c.sub(a), c.sub(b)];

		const right = ac.Cross(ab).Unit;
		const up = bc.Cross(right).Unit;
		const back = bc.Unit;

		const height = math.abs(ab.Dot(up));

		const w1CFrame = CFrame.fromMatrix(a.add(b).div(2), right, up, back);
		const w1 = newWedge(
			new Vector3(thicccccness, height, math.abs(ab.Dot(back))),
			w1CFrame.add(
				right.mul(
					//nothing to see here 👀
					math.floor(math.deg(math.abs(w1CFrame.ToOrientation()[1]))) === errorAngle
						? -half_thicccccness
						: half_thicccccness,
				),
			),
		);

		const w2CFrame = CFrame.fromMatrix(a.add(c).div(2), right.mul(-1), up, back.mul(-1));
		const w2 = newWedge(
			new Vector3(thicccccness, height, math.abs(ac.Dot(back))),
			w2CFrame.add(
				right.mul(
					//nothing to see here 👀
					math.floor(math.deg(math.abs(w2CFrame.ToOrientation()[1]))) === errorAngle
						? -half_thicccccness
						: half_thicccccness,
				),
			),
		);

		return $tuple(w1, w2);
	};
	const generateSquare = (x: number, z: number, xpzp: number, xpzn: number, xnzp: number, xnzn: number) => {
		const vpp = new Vector3(x + squareHalfSize, xpzp, z + squareHalfSize);
		const vpn = new Vector3(x + squareHalfSize, xpzn, z - squareHalfSize);
		const vnp = new Vector3(x - squareHalfSize, xnzp, z + squareHalfSize);
		const vnn = new Vector3(x - squareHalfSize, xnzn, z - squareHalfSize);

		const [w11, w12] = createTriangle(vpp, vpn, vnp);
		const [w21, w22] = createTriangle(vnp, vnn, vpn);

		const minHeight = math.min(xpzp, xpzn, xnzp, xnzn) - GameDefinitions.HEIGHT_OFFSET;
		const maxHeight = math.max(xpzp, xpzn, xnzp, xnzn) - GameDefinitions.HEIGHT_OFFSET;
		const heightDiff = maxHeight - minHeight;

		if (heightDiff > 80 / math.sqrt(chunkResolution / 8)) {
			for (const wedge of [w11, w12, w21, w22]) {
				wedge.Material = Enum.Material.Basalt;
				wedge.Color = new Color3(0.2, 0.2, 0.2);
			}
		} else if (maxHeight > 250) {
			for (const wedge of [w11, w12, w21, w22]) {
				wedge.Material = Enum.Material.Ice;
				wedge.Color = new Color3(1, 1, 1);
			}
		} else {
			for (const wedge of [w11, w12, w21, w22]) {
				wedge.Material = Enum.Material.Grass;
				wedge.Color = Color3.fromRGB(102, 130, 84);
			}
		}

		return $tuple(w11, w12, w21, w22);
	};

	return {
		chunkSize,
		loadDistanceMultiplier: 2,

		renderChunk(chunkx: number, chunkz: number): Instance {
			const chunk = new Instance("Folder", parent);

			for (let iterx = 0; iterx < chunkResolution; iterx++) {
				if (chunkResolution > 1 && math.random() > 0.8) {
					task.wait();
				}

				for (let iterz = 0; iterz < chunkResolution; iterz++) {
					const relx = iterx * squareSize;
					const relz = iterz * squareSize;

					const absx = chunkx * chunkSize + relx;
					const absz = chunkz * chunkSize + relz;

					debug.profilebegin("Generating height");
					const xpzp =
						generator.getHeight((absx + squareHalfSize) / 4, (absz + squareHalfSize) / 4) +
						GameDefinitions.HEIGHT_OFFSET;
					const xpzn =
						generator.getHeight((absx + squareHalfSize) / 4, (absz - squareHalfSize) / 4) +
						GameDefinitions.HEIGHT_OFFSET;
					const xnzp =
						generator.getHeight((absx - squareHalfSize) / 4, (absz + squareHalfSize) / 4) +
						GameDefinitions.HEIGHT_OFFSET;
					const xnzn =
						generator.getHeight((absx - squareHalfSize) / 4, (absz - squareHalfSize) / 4) +
						GameDefinitions.HEIGHT_OFFSET;
					debug.profileend();

					debug.profilebegin("Generating triangles");
					const [w11, w12, w21, w22] = generateSquare(absx, absz, xpzp, xpzn, xnzp, xnzn);
					w11.Parent = chunk;
					w12.Parent = chunk;
					w21.Parent = chunk;
					w22.Parent = chunk;
					debug.profileend();
				}
			}

			return chunk;
		},
		destroyChunk(chunkX: number, chunkZ: number, chunk: Instance): void {
			chunk.Destroy();
		},
		unloadAll(chunks) {
			for (const chunk of chunks) {
				chunk.Destroy();
			}
		},
		destroy() {},
	};
};
