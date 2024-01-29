import { ContextActionService, Players, RunService } from "@rbxts/services";
import Remotes from "shared/Remotes";
import EventHandler from "shared/event/EventHandler";
import PartUtils from "shared/utils/PartUtils";
import Signals from "./event/Signals";
import { PlayerModule } from "./types/PlayerModule";

export default class PlayerController {
	// Character parts
	static character: Model;
	static humanoid: Humanoid;
	static humanoidRootPart: Part;

	// Controller parts
	static controllerManager: ControllerManager;
	private static waterSensor: BuoyancySensor;
	private static airController: AirController;
	private static groundController: GroundController;
	private static climbController: ClimbController;
	private static swimController: SwimController;

	// Sensors
	private static groundSensor: ControllerPartSensor;
	private static climbSensor: ControllerPartSensor;

	private static eventHandler = new EventHandler();

	// Other
	static isRunning: boolean;

	static initialize() {
		Players.LocalPlayer.CharacterAdded.Connect((_) => {
			this.characterAdded();
		});
		this.characterAdded();
	}

	static terminate() {
		print("DEATH");
		this.eventHandler.unsubscribeAll();
		ContextActionService.UnbindAction("Jump");

		this.humanoid.EvaluateStateMachine = true;
		task.wait();
		Remotes.Client.GetNamespace("Player").Get("ResetCharacter").SendToServer();

		Signals.PLAYER.DIED.Fire();
	}

	static characterAdded() {
		print("SPAWN");
		if (!Players.LocalPlayer.HasAppearanceLoaded()) Players.LocalPlayer.CharacterAppearanceLoaded.Wait();

		this.character = Players.LocalPlayer.Character as Model;
		this.humanoid = this.character.WaitForChild("Humanoid") as Humanoid;
		this.humanoidRootPart = this.character.WaitForChild("HumanoidRootPart") as Part;

		// Switch to native code when player died
		this.eventHandler.subscribe(this.humanoid.GetPropertyChangedSignal("Health"), () => {
			if (this.humanoid.Health <= 0) this.terminate();
		});

		// Running state
		this.eventHandler.subscribe(this.humanoid.Running, (speed) => {
			this.isRunning = speed > this.controllerManager.BaseMoveSpeed / 2;
		});

		// Debug info
		// this.humanoid.StateChanged.Connect((oldState, newState) => {
		// 	Logger.info(
		// 		`Change state: ${tostring(newState)} | Change controller: ${tostring(
		// 			this.controllerManager.ActiveController,
		// 		)}`,
		// 	);
		// });

		this.setupCharacter();
		this.removeFluidForces();

		ContextActionService.BindAction("Jump", (a, b, c) => this.doJump(a, b, c), true, Enum.KeyCode.Space);
		this.eventHandler.subscribe(RunService.PreAnimation, () => this.stepController());

		Signals.PLAYER.SPAWN.Fire();
	}

	static getPlayerModuleInstance(): ModuleScript {
		return Players.LocalPlayer.WaitForChild("PlayerScripts").WaitForChild("PlayerModule") as ModuleScript;
	}

	static getPlayerModule(): PlayerModule {
		return require(this.getPlayerModuleInstance()) as PlayerModule;
	}

	static removeFluidForces() {
		PartUtils.applyToAllDescendantsOfType("BasePart", Players.LocalPlayer.Character!, (part) => {
			part.EnableFluidForces = false;
		});
	}

	static setupCharacter() {
		this.controllerManager = new Instance("ControllerManager");
		this.groundController = new Instance("GroundController", this.controllerManager);

		// Other instances
		this.airController = new Instance("AirController", this.controllerManager);
		this.climbController = new Instance("ClimbController", this.controllerManager);
		this.swimController = new Instance("SwimController", this.controllerManager);

		// Configuring
		this.controllerManager.RootPart = this.humanoidRootPart;
		this.controllerManager.FacingDirection = this.controllerManager.RootPart.CFrame.LookVector;
		this.groundController.GroundOffset = this.humanoid.HipHeight;

		// Floor sensor
		this.groundSensor = new Instance("ControllerPartSensor");
		this.groundSensor.SensorMode = Enum.SensorMode.Floor;
		this.groundSensor.SearchDistance = this.groundController.GroundOffset + 0.5;
		this.groundSensor.Name = "GroundSensor";

		// Water sensor
		this.waterSensor = new Instance("BuoyancySensor");

		// Ladder sensor
		this.climbSensor = new Instance("ControllerPartSensor");
		this.climbSensor.SensorMode = Enum.SensorMode.Ladder;
		this.climbSensor.SearchDistance = 1.5;
		this.climbSensor.Name = "ClimbSensor";

		// Definition
		this.controllerManager.GroundSensor = this.groundSensor;
		this.controllerManager.ClimbSensor = this.climbSensor;

		this.waterSensor.Parent = this.controllerManager.RootPart;
		this.groundSensor.Parent = this.controllerManager.RootPart;
		this.climbSensor.Parent = this.controllerManager.RootPart;
		this.controllerManager.Parent = this.character;

		this.humanoid.EvaluateStateMachine = false; // Disable default controls

		// Manage attribute for configuring Jump power
		this.controllerManager.SetAttribute("JumpImpulse", new Vector3(0, 800, 0));
	}

	/** Returns true if the controller is assigned, in world, and being simulated */
	static isControllerActive(controller: ControllerBase) {
		return this.controllerManager.ActiveController === controller && controller.Active;
	}

	/** Returns true if the Buoyancy sensor detects the root part is submerged in water, and we aren't already swimming */
	static checkSwimmingState() {
		return this.waterSensor.TouchingSurface && this.humanoid.GetState() !== Enum.HumanoidStateType.Swimming;
	}

	/** Returns true if neither the GroundSensor || ClimbSensor found a Part and, we don't have the AirController active */
	static checkFreefallState() {
		return (
			(this.groundSensor.SensedPart === undefined &&
				this.climbSensor.SensedPart === undefined &&
				!(this.isControllerActive(this.airController) || this.waterSensor.TouchingSurface)) ||
			this.humanoid.GetState() === Enum.HumanoidStateType.Jumping
		);
	}

	/** Returns true if the GroundSensor found a Part, we don't have the GroundController active, and we didn't just Jump */
	static checkRunningState() {
		return (
			this.groundSensor.SensedPart !== undefined &&
			!this.isControllerActive(this.groundController) &&
			this.humanoid.GetState() !== Enum.HumanoidStateType.Jumping
		);
	}

	/** Returns true of the ClimbSensor found a Part && we don't have the ClimbController active */
	static checkClimbingState() {
		return this.climbSensor.SensedPart !== undefined && !this.isControllerActive(this.climbController);
	}

	/** The Controller determines the type of locomotion && physics behavior; setting the humanoid state is just so animations will play, required */
	static updateStateAndActiveController() {
		if (this.humanoid.Sit) {
			this.humanoid.ChangeState(Enum.HumanoidStateType.Seated);
		} else if (this.checkSwimmingState()) {
			this.controllerManager.ActiveController = this.swimController;
			this.humanoid.ChangeState(Enum.HumanoidStateType.Swimming);
		} else if (this.checkClimbingState()) {
			this.controllerManager.ActiveController = this.climbController;
			this.humanoid.ChangeState(Enum.HumanoidStateType.Climbing);
		} else if (this.checkRunningState()) {
			this.controllerManager.ActiveController = this.groundController;
			this.humanoid.ChangeState(Enum.HumanoidStateType.Running);
		} else if (this.checkFreefallState()) {
			this.controllerManager.ActiveController = this.airController;
			this.humanoid.ChangeState(Enum.HumanoidStateType.Freefall);
		}
	}

	// Take player input from Humanoid && apply directly to the ControllerManager.
	static updateMovementDirection() {
		const dir = this.humanoid.MoveDirection;
		this.controllerManager.MovingDirection = dir;

		if (dir.Magnitude > 0) {
			this.controllerManager.FacingDirection = dir;
		} else {
			if (this.isControllerActive(this.swimController)) {
				this.controllerManager.FacingDirection = this.humanoidRootPart.CFrame.UpVector;
			} else {
				this.controllerManager.FacingDirection = this.humanoidRootPart.CFrame.LookVector;
			}
		}
	}

	// Jump input
	static doJump(actionName: string, inputState: Enum.UserInputState, inputObject: InputObject) {
		if (inputState === Enum.UserInputState.Begin) {
			if (this.humanoid.Sit === true) {
				this.humanoid.Sit = false;
			} else {
				if (!this.isControllerActive(this.groundController)) {
					return;
				}
			}

			const jumpImpulse = this.controllerManager.GetAttribute("JumpImpulse") as Vector3;
			this.humanoidRootPart.ApplyImpulse(jumpImpulse);

			this.humanoid.ChangeState(Enum.HumanoidStateType.Jumping);
			this.controllerManager.ActiveController = this.airController;

			// floor receives equal && opposite force
			const floor = this.groundSensor.SensedPart;
			if (floor) {
				floor.ApplyImpulseAtPosition(jumpImpulse.mul(-1), this.groundSensor.HitFrame.Position);
			}
		}
	}

	/** Main character update loop  */
	static stepController() {
		if (!this.humanoidRootPart) return;

		this.updateMovementDirection();

		this.updateStateAndActiveController();
	}
}
