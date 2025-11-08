import { Players, RunService, Workspace } from "@rbxts/services";
import { A2SRemoteEvent } from "engine/shared/event/PERemoteEvent";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";
const defaultEnableAngleBool = {
	types: {
		bool: {
			config: true,
		},
	},
};
const definition = {
	inputOrder: [
		"gyroMode",
		"targetAngle",
		"enabled",
		"angleXEnabled",
		"angleYEnabled",
		"angleZEnabled",
		"torque",
		"responsiveness",
	],
	input: {
		targetAngle: {
			displayName: "Target Angle",
			tooltip: "The angle it's going to follow (in degrees)",
			types: {
				vector3: {
					config: Vector3.zero,
				},
			},
		},
		// disables/enables each axis
		angleXEnabled: {
			displayName: "Update Angle X",
			tooltip: "If the X Axis should update its angle.",
			...defaultEnableAngleBool,
		},
		angleYEnabled: {
			displayName: "Update Angle Y",
			tooltip: "If the Y Axis should update its angle.",
			...defaultEnableAngleBool,
		},
		angleZEnabled: {
			displayName: "Update Angle Z",
			tooltip: "If the Z Axis should update its angle.",
			...defaultEnableAngleBool,
		},
		// this disables it entirely
		enabled: {
			displayName: "Enable",
			...defaultEnableAngleBool,
		},
		gyroMode: {
			displayName: "Mode",
			types: {
				enum: {
					config: "followCamera",
					elementOrder: ["localAngle", "followAngle", "followCamera", "followCursor"],
					elements: {
						localAngle: {
							displayName: "Velocity Angle",
							tooltip: "Make the block follow the local angle. Limited by torque.",
						},
						followAngle: {
							displayName: "Follow Angle",
							tooltip: "Make the block follow the global angle.",
						},
						followCamera: { displayName: "Follow Camera", tooltip: "Follow player's camera angle." },
						followCursor: { displayName: "Follow Cursor", tooltip: "Follow player's cursor." },
					},
				},
			},
			connectorHidden: true,
		},
		torque: {
			displayName: "Torque",
			tooltip: "The amount of rotational force applied to the gyroscope",
			types: {
				number: {
					config: 100000,
					clamp: {
						min: 0,
						max: 50_000_000,
						showAsSlider: true,
					},
				},
			},
		},
		responsiveness: {
			displayName: "Responsiveness",
			tooltip: "How fast it will adjust to a target angle",
			types: {
				number: {
					config: 10,
					clamp: {
						min: 0,
						max: 100,
						showAsSlider: true,
					},
				},
			},
		},
	},

	output: {},
} as const satisfies BlockLogicFullBothDefinitions;

type GyroBlockModel = BlockModel & {
	Base: BasePart & {
		AlignOrientation: AlignOrientation;
		Attachment0: Attachment;
	};
	ringZ: BasePart;
	ringY: BasePart;
	ringX: BasePart;
};

type modes = keyof typeof definition.input.gyroMode.types.enum.elements;

export type { Logic as GyroscopeBlockLogic };
@injectable
class Logic extends InstanceBlockLogic<typeof definition, GyroBlockModel> {
	static events = {
		sync: new A2SRemoteEvent<{
			block: GyroBlockModel;
			constraint_cframe: CFrame;
		}>("sync_gyro", "RemoteEvent"),
	};

	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		const targetAngle = this.initializeInputCache("targetAngle");
		const enabled = this.initializeInputCache("enabled");
		const gMode = this.initializeInputCache("gyroMode");
		const updateX = this.initializeInputCache("angleXEnabled");
		const updateY = this.initializeInputCache("angleYEnabled");
		const updateZ = this.initializeInputCache("angleZEnabled");
		const torq = this.initializeInputCache("torque");

		const inst = this.instance;
		const Xring = inst.ringX;
		const Yring = inst.ringY;
		const Zring = inst.ringZ;

		const base = inst.Base;
		const attachment = base.Attachment0;

		const player = Players.LocalPlayer;
		const al = base.AlignOrientation;

		// 'magic' offset needed as the world is rotated 90deg.. for some reason...
		const magicOffset = new Vector3(90, 0, 0);
		const magicCFrameOffset = CFrame.fromOrientation(0, math.pi / 2, 0);
		let cachedCFrame = magicCFrameOffset;

		const isNaN = (val: number) => val !== val;
		const CFrameToAngle = (cf: CFrame) => new Vector3(...cf.ToEulerAnglesXYZ()).apply((v) => math.deg(v));
		const convertToEnabledAxis = (inp: Vector3) =>
			new Vector3(updateX.get() ? inp.X : 0, updateY.get() ? inp.Y : 0, updateZ.get() ? inp.Z : 0);

		const unpackVector = (inp: Vector3): [number, number, number] => [inp.X, inp.Y, inp.Z];
		const transformToCFrame = (inp: Vector3) => CFrame.fromOrientation(...unpackVector(convertToEnabledAxis(inp)));
		const convertToEnabledCframe = (inp: CFrame) => transformToCFrame(new Vector3(...inp.ToOrientation()));

		const applyTargetAngle = (): Vector3 => {
			const mode = gMode.get();

			if (mode === "followAngle") {
				const tg = targetAngle.get().apply((v) => (isNaN(v) ? 0 : math.rad(v)));
				cachedCFrame = CFrame.fromOrientation(tg.X, tg.Y, tg.Z);
				return targetAngle.get();
			}

			if (mode === "followCamera") {
				//this is where the magic happens
				cachedCFrame = convertToEnabledCframe(Workspace.CurrentCamera!.CFrame.mul(magicCFrameOffset));
				return CFrameToAngle(cachedCFrame);
			}

			if (mode === "followCursor") {
				const mouse = player.GetMouse();
				const dir = Workspace.CurrentCamera!.ScreenPointToRay(mouse.X, mouse.Y).Direction;
				const pos = attachment.Position;
				cachedCFrame = convertToEnabledCframe(CFrame.lookAt(pos, pos.add(dir)).mul(magicCFrameOffset));
				return CFrameToAngle(cachedCFrame);
			}
			return Vector3.zero;
		};

		const updateLogic = () => {
			//update ring position anyways
			[Xring.Position, Yring.Position, Zring.Position] = [base.Position, base.Position, base.Position];

			// main logic
			if (!enabled.get()) return;
			const ta = targetAngle.get();
			if (gMode.get() !== "localAngle") {
				const resAngle = applyTargetAngle().add(magicOffset);
				if (updateX.get()) Xring.Rotation = new Vector3(resAngle.X, 0, 0);
				if (updateY.get()) Yring.Rotation = new Vector3(0, resAngle.Y, 0);
				if (updateZ.get()) Zring.Rotation = new Vector3(0, 0, resAngle.Z);
				return;
			}

			const bcf = base.CFrame;
			let res = bcf.RightVector.mul(updateX.get() ? ta.X : 0)
				.add(bcf.UpVector.mul(updateY.get() ? ta.Y : 0))
				.add(bcf.LookVector.mul(updateZ.get() ? ta.Z : 0));

			// limit rotation by torque
			if (res.Magnitude > torq.get()) res = res.mul(torq.get() / res.Magnitude);

			base.ApplyAngularImpulse(res);
		};

		this.event.subscribe(RunService.Heartbeat, () => {
			updateLogic();
			al.CFrame = cachedCFrame;
		});

		this.on(({ responsiveness, torque, gyroMode, enabled }) => {
			// constraint parameters
			al.Responsiveness = responsiveness;
			al.Enabled = gyroMode !== "localAngle" && enabled;
			al.MaxTorque = torque;
		});
	}
}

export const GyroscopeBlock = {
	...BlockCreation.defaults,
	id: "gyroscope",
	displayName: "Gyroscope",
	description: "Makes your things rotate to desired angle. Has different modes.",
	limit: 40,

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
