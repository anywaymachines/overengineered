import { Workspace } from "@rbxts/services";
import { Colors } from "client/gui/Colors";
import { DebugLog } from "client/gui/DebugLog";
import { Element } from "shared/Element";

if (true as boolean) {
	Workspace.WaitForChild("test1").Destroy();
	Workspace.WaitForChild("test3").Destroy();
	new Instance("BindableEvent").Event.Wait();
}

const createSegment = () => {
	return Element.create("Frame", {
		Size: new UDim2(0, 4, 1, 0),
		AnchorPoint: new Vector2(0.5, 0),
		BackgroundColor3: Colors.red,
		BorderSizePixel: 0,
	});
};
const createRulerGui = (segments: number): Frame => {
	const frame = Element.create("Frame", { BackgroundTransparency: 1 });

	for (let i = 0; i <= segments; i++) {
		const segment = createSegment();
		segment.Position = new UDim2(i / segments, 0, 0, 0);

		segment.Parent = frame;
	}

	return frame;
};
const createCountsText = () => {
	const adornee = Element.create("Part", { Anchored: true, Transparency: 1, Size: new Vector3(1, 1, 1) });
	const text = Element.create(
		"BillboardGui",
		{ Size: new UDim2(0, 200, 0, 50), Adornee: adornee, Parent: adornee, AlwaysOnTop: true },
		{
			text: Element.create("TextLabel", {
				Size: new UDim2(1, 0, 1, 0),
				AutoLocalize: false,
				BackgroundTransparency: 1,
				FontFace: Element.newFont(Enum.Font.Ubuntu, Enum.FontWeight.Bold),
				TextSize: 20,
				TextColor3: Colors.black,
				TextStrokeColor3: Colors.white,
				TextStrokeTransparency: 0,
			}),
		},
	);

	return {
		part: adornee,
		setCounts: (x: number, y: number, z: number) => (text.text.Text = `${x}, ${y}, ${z}`),
	} as const;
};

const createRuler = (model: Model, counts: Vector3int16) => {
	const parent = Element.create("Folder");
	const [rot, size] = model.GetBoundingBox();
	const sz = 1;

	const cr = (tipe: "X" | "Y" | "Z") => {
		const ruler = Element.create(
			"Folder",
			{},
			{
				part: Element.create("Part", {
					Anchored: true,
					CanCollide: false,
					CanTouch: false,
					Position:
						tipe === "Z"
							? rot.mul(new Vector3(0, size.Y / 2 + sz / 2, size.Z / 2))
							: tipe === "X"
								? rot.mul(new Vector3(-size.X / 2, size.Y / 2 + sz / 2, 0))
								: rot.mul(new Vector3(size.X / 2 + sz / 2, 0, size.Z / 2)),
					Size:
						tipe === "Z"
							? new Vector3(size.X, sz, 0.001)
							: tipe === "X"
								? new Vector3(0.001, sz, size.Z)
								: new Vector3(sz, size.Y, 0.001),
					Transparency: 1,
				}),
				surface: Element.create(
					"SurfaceGui",
					{
						SizingMode: Enum.SurfaceGuiSizingMode.PixelsPerStud,
						Face:
							tipe === "X"
								? Enum.NormalId.Right
								: tipe === "Y"
									? Enum.NormalId.Right
									: Enum.NormalId.Front,
					},
					{ frame: createRulerGui(counts[tipe]) },
				),
			},
		);
		ruler.surface.Adornee = ruler.part;
		ruler.surface.frame.Size = new UDim2(1, 0, 1, 0);
		ruler.Parent = parent;

		return ruler;
	};

	const cr2 = (amount: number) => {
		const ruler = Element.create(
			"Folder",
			{},
			{
				part: Element.create("Part", {
					Anchored: true,
					CanCollide: false,
					CanTouch: false,
					Position: rot.mul(new Vector3(0, size.Y / 2 + sz / 2, size.Z / 2)),
					Size: new Vector3(size.X, sz, 0.001),
					Transparency: 1,
				}),
				surface: Element.create(
					"SurfaceGui",
					{ SizingMode: Enum.SurfaceGuiSizingMode.PixelsPerStud },
					{ frame: createRulerGui(amount) },
				),
			},
		);
		ruler.surface.Adornee = ruler.part;
		ruler.surface.frame.Size = new UDim2(1, 0, 1, 0);
		ruler.Parent = parent;

		return ruler;
	};

	const x = cr2(counts.X);
	const y = cr2(counts.Y);
	const z = cr2(counts.Z);

	y.part.Position = new Vector3();

	parent.Parent = Workspace;
	return parent;
};

const t2 = (basePart: BasePart) => {
	const size = basePart.Size;

	const getVisibleSide = (part: BasePart, axis: Enum.Axis, size: number): "Negative" | "Positive" | "None" => {
		const cameraCFrame = Workspace.CurrentCamera?.CFrame;
		if (!cameraCFrame) return "None";

		const partCFrame = part.GetPivot();

		const getDotProduct = (mul: number) => {
			const sideDirection = Vector3.FromAxis(axis).mul(mul);
			const sideCenter = partCFrame.add(sideDirection.mul(size / 2));
			const lookAt = CFrame.lookAt(sideCenter.Position, cameraCFrame.Position);

			return sideDirection.Dot(lookAt.LookVector);
		};

		DebugLog.startCategory("Dot products");
		DebugLog.named(axis.Name, getDotProduct(1));
		DebugLog.named(axis.Name, getDotProduct(-1));
		DebugLog.endCategory();

		if (getDotProduct(1) > 0) {
			return "Positive";
		}
		if (getDotProduct(-1) > 0) {
			return "Negative";
		}
		return "None";
	};

	const createRuler = (axis: Enum.Axis, color: Color3, size: number) => {
		const thickness = 0.2;

		const rulerPart = new Instance("Part");
		rulerPart.Size = new Vector3(thickness, thickness, size);
		rulerPart.Anchored = true;
		rulerPart.CanCollide = false;
		rulerPart.Color = color;

		const direction = Vector3.FromAxis(axis);
		const directionCframe = CFrame.lookAlong(Vector3.zero, direction);
		const pos = basePart
			.GetPivot()
			.add(directionCframe.mul(new Vector3((size + thickness) / 2, (size + thickness) / 2, 0)));

		rulerPart.PivotTo(directionCframe.add(pos.Position));
		rulerPart.Parent = Workspace;

		task.spawn(() => {
			while (true as boolean) {
				task.wait();

				DebugLog.startCategory("RULER TEST", true);
				const visible = getVisibleSide(basePart, axis, size);
				DebugLog.named(axis.Name, visible);
				DebugLog.endCategory();

				rulerPart.Transparency = visible === "None" ? 1 : 0;
				/*if (visible === "None") {
					rulerPart.Color = Colors.black;
				} else if (visible === "Negative") {
					rulerPart.Color = Colors.green;
				} else {
					rulerPart.Color = Colors.white;
				}*/

				if (visible !== "None") {
					const direction = visible === "Positive" ? Vector3.FromAxis(axis) : Vector3.FromAxis(axis).mul(-1);
					const directionCframe = CFrame.lookAlong(Vector3.zero, direction);
					const pos = basePart
						.GetPivot()
						.add(directionCframe.mul(new Vector3((size + thickness) / 2, (size + thickness) / 2, 0)));

					rulerPart.PivotTo(directionCframe.add(pos.Position));
				}
			}
		});
	};

	const xRulerPart = createRuler(Enum.Axis.X, new Color3(1, 0, 0), size.X);
	const yRulerPart = createRuler(Enum.Axis.Y, new Color3(0, 1, 0), size.Y);
	const zRulerPart = createRuler(Enum.Axis.Z, new Color3(0, 0, 1), size.Z);

	/*task.spawn(() => {
		while (true as boolean) {
			task.wait();

			DebugLog.category("Ruler");

			const xvisible = getVisibleSide(basePart, Enum.Axis.X, size.X);
			const yvisible = getVisibleSide(basePart, Enum.Axis.Y, size.Y);
			const zvisible = getVisibleSide(basePart, Enum.Axis.Z, size.Z);

			DebugLog.named(Enum.Axis.X, xvisible);
			DebugLog.named(Enum.Axis.Y, yvisible);
			DebugLog.named(Enum.Axis.Z, zvisible);
			DebugLog.endCategory();

			rulerPart.Transparency = visible === "None" ? 1 : 0;

			if (visible !== "None") { 
				const direction = visible === "Positive" ? Vector3.FromAxis(axis) : Vector3.FromAxis(axis).mul(-1);
				const directionCframe = CFrame.lookAlong(Vector3.zero, direction);
				const pos = basePart
					.GetPivot()
					.add(directionCframe.mul(new Vector3(size.add(thickness).div(2), size.add(thickness).div(2), 0)));

				rulerPart.PivotTo(directionCframe.add(pos.Position));
			}
		}
	});*/
};
t2(Workspace.WaitForChild("test3") as BasePart);

const model = Workspace.WaitForChild("test1") as Model;
const counts = new Vector3int16(4, 1, 16);
const r = createRuler(model, counts);

const ct = createCountsText();
ct.part.Parent = Workspace;

while (true as boolean) {
	task.wait();

	const closest = (origin: Vector3, points: readonly Vector3[]) => {
		let result = new Vector3(math.huge, math.huge, math.huge);
		let magnitude = math.huge;

		for (const point of points) {
			const mg = origin.sub(point).Magnitude;
			if (mg < magnitude) {
				result = point;
				magnitude = mg;
			}
		}

		return result;
	};

	const [mcf, ms] = model.GetBoundingBox();
	const points: Vector3[] = [];
	const addIfVisible = (point: Vector3) => {
		const [, visible] = Workspace.CurrentCamera!.WorldToScreenPoint(point);
		if (visible) points.push(point);
	};

	addIfVisible(mcf.mul(new Vector3(ms.X / 2, ms.Y / 2, ms.Z / 2)));
	addIfVisible(mcf.mul(new Vector3(-ms.X / 2, ms.Y / 2, ms.Z / 2)));
	addIfVisible(mcf.mul(new Vector3(-ms.X / 2, -ms.Y / 2, ms.Z / 2)));
	addIfVisible(mcf.mul(new Vector3(-ms.X / 2, ms.Y / 2, -ms.Z / 2)));
	addIfVisible(mcf.mul(new Vector3(-ms.X / 2, -ms.Y / 2, -ms.Z / 2)));
	addIfVisible(mcf.mul(new Vector3(ms.X / 2, -ms.Y / 2, ms.Z / 2)));
	addIfVisible(mcf.mul(new Vector3(ms.X / 2, -ms.Y / 2, -ms.Z / 2)));
	addIfVisible(mcf.mul(new Vector3(ms.X / 2, ms.Y / 2, -ms.Z / 2)));

	const origin = Workspace.CurrentCamera?.CFrame?.Position;
	if (!origin) continue;

	const fx = closest(origin, points);
	ct.part.Position = fx;
	ct.setCounts(counts.X, counts.Y, counts.Z);
}
