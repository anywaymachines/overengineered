import { Players, RunService, UserInputService, Workspace } from "@rbxts/services";
import { Achievement } from "server/Achievement";
import { LogicOverclockBlock } from "shared/blocks/blocks/LogicOverclockBlock";
import { LuaCircuitBlock } from "shared/blocks/blocks/LuaCircuitBlock";
import { BlockManager } from "shared/building/BlockManager";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { CustomRemotes } from "shared/Remotes";
import type { baseAchievementStats } from "server/Achievement";
import type { PlayerDatabase } from "server/database/PlayerDatabase";
import type { PlayModeController } from "server/modes/PlayModeController";
import type { ServerPlayerController } from "server/ServerPlayerController";
import type { SharedPlots } from "shared/building/SharedPlots";
import type { FireEffect } from "shared/effects/FireEffect";
import type { PlayerDataStorageRemotesBuilding } from "shared/remotes/PlayerDataRemotes";

type triggerInstances = Folder & Record<`trigger${number}`, BasePart>;

const ws = Workspace as Workspace & {
	Triggers: {
		Centrifuge: triggerInstances;
		AmogusTrack: triggerInstances;
		AirRingsEasy: triggerInstances;
		AirRingsMedium: triggerInstances;
		AirRingsHard: triggerInstances;
		OvalTrack: triggerInstances;
	};
	Map: Folder & {
		Banana: Model;
		UFO: Model;
		"Main Island": {
			Fun: {
				Destructibles: Folder;
			};
		};
	};
};

const _triggers = ws.Triggers;

//make triggers invisible on run
for (const f of Workspace.FindFirstChild("Triggers")!.GetChildren()) {
	f.GetChildren().forEach((v) => ((v as BasePart).Transparency = 1));
}

// DO NOT CHANGE! RETURNS SORTED ARRAY!
const getTriggerList = (n: keyof typeof _triggers) => {
	const tgs = _triggers[n];
	const rawlist = tgs.GetChildren() as (BasePart | UnionOperation)[];
	const list = [];
	for (let i = 0; i < rawlist.size(); i++) {
		const v = tgs.FindFirstChild(`trigger${i}`);
		if (!v) throw `Trigger init error: "trigger${i}" not found in triggers of ${n}`;
		list[i] = v as BasePart | UnionOperation;
	}

	const record = {} as triggerInstances;
	list.forEach((v) => (record[v.Name as `trigger${number}`] = v));
	return $tuple(list, record);
};

/*
	PLEASE DO NOT SPOIL THE ACHIEVEMENTS FOR OTHER PLAYERS!!!
	PLEASE DO NOT SPOIL THE ACHIEVEMENTS FOR OTHER PLAYERS!!!
	PLEASE DO NOT SPOIL THE ACHIEVEMENTS FOR OTHER PLAYERS!!!
	PLEASE DO NOT SPOIL THE ACHIEVEMENTS FOR OTHER PLAYERS!!!
	PLEASE DO NOT SPOIL THE ACHIEVEMENTS FOR OTHER PLAYERS!!!
	PLEASE DO NOT SPOIL THE ACHIEVEMENTS FOR OTHER PLAYERS!!!
	PLEASE DO NOT SPOIL THE ACHIEVEMENTS FOR OTHER PLAYERS!!!
	PLEASE DO NOT SPOIL THE ACHIEVEMENTS FOR OTHER PLAYERS!!!
	PLEASE DO NOT SPOIL THE ACHIEVEMENTS FOR OTHER PLAYERS!!!
	PLEASE DO NOT SPOIL THE ACHIEVEMENTS FOR OTHER PLAYERS!!!
	PLEASE DO NOT SPOIL THE ACHIEVEMENTS FOR OTHER PLAYERS!!!
	PLEASE DO NOT SPOIL THE ACHIEVEMENTS FOR OTHER PLAYERS!!!
	PLEASE DO NOT SPOIL THE ACHIEVEMENTS FOR OTHER PLAYERS!!!
*/

@injectable
class AchievementWelcome extends Achievement {
	constructor(@inject player: Player) {
		super(player, {
			id: "WELCOME",
			name: `Hello!`,
			description: `Welcome to OverEngineered!`,
			imageID: "78364064019512",
		});

		this.onEnable(() => this.set({ completed: true }));
	}
}

@injectable
class AchievementTheIssue extends Achievement {
	constructor(@inject player: Player) {
		super(player, {
			id: "THE_ISSUE",
			name: "DMCA abuse",
			description: "Now go to our community server and read #the-issue channel",
			hidden: true,
			imageID: "76517691012059",
		});

		this.event.subscribe(player.Chatted, (msg, recv) => {
			if (recv) return;
			this.set({ completed: msg.fullLower().contains("plane crazy") });
		});
	}
}

@injectable
class AchievementLuaCircuitObtained extends Achievement {
	constructor(@inject player: Player, @inject playerDatabase: PlayerDatabase) {
		super(player, {
			id: "LUA_CIRCUIT",
			name: "Oh yeah, it's big brain time",
			description: `Obtain ${LuaCircuitBlock.displayName} by joining our community server and following instructions there.`,
			imageID: "93831558669845",
		});

		this.onEnable(() => {
			this.set({ completed: (playerDatabase.get(player.UserId).features?.indexOf("lua_circuit") ?? -1) > -1 });
		});
	}
}

abstract class AchievementPlaytime extends Achievement<{ seconds_spent: number }> {
	constructor(player: Player, data: Partial<baseAchievementStats>, target_seconds: number) {
		//1 hour
		const target_hours = target_seconds / 60 / 60;
		super(player, {
			id: "SPEND_1_HOUR",
			name: `Spare time`,
			description: `Play for over ${target_hours} ${target_hours > 1 ? "hours" : "hour"} in total`,
			max: target_seconds,
			units: "time",
			imageID: "100755497882706",
			...data,
		});

		this.onEnable(() => {
			// getData will return 0 or undefined if run before enable
			let seconds_spent = this.getData()?.seconds_spent ?? 0;
			this.event.subscribe(RunService.Heartbeat, (delta) => {
				seconds_spent += delta;
				this.set({ progress: seconds_spent, seconds_spent });
			});
		});
	}
}

@injectable
class AchievementPlaytime1H extends AchievementPlaytime {
	constructor(@inject player: Player) {
		super(
			player,
			{
				id: "SPEND_1_HOUR",
				name: `Spare time`,
			},
			1 * 60 * 60,
		);
	}
}

@injectable
class AchievementPlaytime4H extends AchievementPlaytime {
	constructor(@inject player: Player) {
		super(
			player,
			{
				id: "SPEND_4_HOUR",
				name: `Time well spent`,
			},
			4 * 60 * 60,
		);
	}
}

@injectable
class AchievementPlaytime12H extends AchievementPlaytime {
	constructor(@inject player: Player) {
		super(
			player,
			{
				id: "SPEND_12_HOUR",
				name: `Master Engineer`,
			},
			12 * 60 * 60,
		);
	}
}

@injectable
class AchievementPlaytime36H extends AchievementPlaytime {
	constructor(@inject player: Player) {
		super(
			player,
			{
				id: "SPEND_36_HOUR",
				name: `Get a Life`,
				hidden: true,
			},
			36 * 60 * 60,
		);
	}
}
@injectable
class AchievementAfkTime extends Achievement<{ seconds_record: number }> {
	constructor(@inject player: Player) {
		//15 minutes
		const target_seconds = 15 * 60;
		const target_minutes = target_seconds / 60;
		super(player, {
			id: "BE_AFK_15_MINUTES",
			name: `DON'T TOUCH ANYTHING!`,
			description: `Be AFK for ${target_minutes} minutes`,
			hidden: true,
			max: target_seconds,
			units: "time",
			imageID: "100755497882706",
		});

		this.onEnable(() => {
			let seconds_record = this.getData()?.seconds_record ?? 0;
			let tsk: thread;
			let isAfk = false;
			this.event.subscribe(UserInputService.InputBegan, () => {
				isAfk = false;
				if (tsk) task.cancel(tsk);
				tsk = task.delay(60, () => (isAfk = true));
			});

			this.event.subscribe(RunService.Heartbeat, (delta) => {
				if (!isAfk) return;
				seconds_record += delta;
				this.set({ progress: seconds_record, seconds_record });
			});
		});
	}
}

abstract class AchievementHeightRecord extends Achievement<{ height_record: number }> {
	constructor(player: Player, name: string, description: string, targetHeight: number, hidden: boolean = false) {
		super(player, {
			id: `HEIGHT_TARGET_${targetHeight}`,
			name,
			description: `${description} (${targetHeight} studs traveled)`,
			max: targetHeight,
			hidden,
			imageID: "105060915517150",
		});

		this.onEnable(() => {
			let height_record = this.getData()?.height_record ?? 0;
			this.event.subscribe(RunService.Heartbeat, () => {
				const character = player.Character?.PrimaryPart;
				if (!character) return;

				height_record = math.max(character.Position.Y - GameDefinitions.HEIGHT_OFFSET, height_record);
				this.set({ progress: height_record, height_record });
			});
		});
	}
}

@injectable
class AchievementHeightRecord25k extends AchievementHeightRecord {
	constructor(@inject player: Player) {
		super(player, `Space tourism`, `Leave the atmosphere`, 25_000);
	}
}

@injectable
class AchievementHeightRecord75k extends AchievementHeightRecord {
	constructor(@inject player: Player) {
		super(player, `SPAAAAACE`, `Deeper into the void!`, 75_000);
	}
}

@injectable
class AchievementHeightRecord150k extends AchievementHeightRecord {
	constructor(@inject player: Player) {
		super(player, `Deepfried space`, `Things are wobbly over here`, 150_000);
	}
}

@injectable
class AchievementHeightRecord500k extends AchievementHeightRecord {
	constructor(@inject player: Player) {
		super(player, `Outer Spaced`, `Long trip home`, 500_000, true);
	}
}

abstract class AchievementSpeedRecord extends Achievement<{ time_record: number }> {
	constructor(player: Player, name: string, targetSpeed: number, hidden = false) {
		super(player, {
			id: `SPEED_TARGET_${targetSpeed}`,
			name: name,
			description: `Reach speed over ${targetSpeed} studs/second in horizontal axis for 3 seconds`,
			hidden,
			max: 3,
			units: "time",
			imageID: "84161963549773",
		});

		this.onEnable(() => {
			let counter = 0;
			let time_record = this.getData()?.time_record ?? 0;
			this.event.subscribe(RunService.Heartbeat, (delta) => {
				const character = player.Character?.PrimaryPart;
				if (!character) return (counter = 0);

				//exclude Y axis becuase it can be abused by helium and other things
				// should angular velocity really be included? I dunno
				const speed = character.AssemblyLinearVelocity.apply((v, a) => (a === "Y" ? 0 : v)).add(
					character.AssemblyAngularVelocity,
				).Magnitude;

				if (speed < targetSpeed) return (counter = 0);

				time_record = math.max((counter += delta), time_record);
				this.set({ progress: counter, time_record });
			});
		});
	}
}

@injectable
class AchievementSpeedRecord1k extends AchievementSpeedRecord {
	constructor(@inject player: Player) {
		super(player, `A bit fast, eh?`, 1000);
	}
}

@injectable
class AchievementSpeedRecord5k extends AchievementSpeedRecord {
	constructor(@inject player: Player) {
		super(player, `4.114 Machs doesn't sound like a lot`, 5000);
	}
}

@injectable
class AchievementSpeedRecord15k extends AchievementSpeedRecord {
	constructor(@inject player: Player) {
		super(player, `BRO WHERE ARE WE GOING?!`, 15_000, true);
	}
}

@injectable
class AchievementSpeedRecord50k extends AchievementSpeedRecord {
	constructor(@inject player: Player) {
		super(player, `Typical High Speed Fan`, 50_000, true);
	}
}

@injectable
class AchievementSpeedRecord100k extends AchievementSpeedRecord {
	constructor(@inject player: Player) {
		super(player, `Lightspeed Enjoyer`, 150_000, true);
	}
}

@injectable
class AchievementCatchOnFire extends Achievement {
	constructor(@inject player: Player, @inject fireffect: FireEffect, @inject plots: SharedPlots) {
		super(player, {
			id: "CATCH_ON_FIRE",
			name: "OverCooked!",
			description: "Better call the fire department! (We don't have one)",
			imageID: "89747760666734",
		});

		this.event.subscribe(fireffect.event.s2c.sent, (_, args) => {
			const owner = plots.plots.find((c) => args.part.IsDescendantOf(c.instance))?.ownerId?.get();
			if (!owner) return;

			this.set({ completed: owner === player.UserId });
		});
	}
}

@injectable
class AchievementOverclock extends Achievement {
	constructor(
		@inject player: Player,
		@inject playModeController: PlayModeController,
		@inject plots: SharedPlots,
		@inject plot: PlayerDataStorageRemotesBuilding,
	) {
		super(player, {
			id: "USE_OVERCLOCK",
			name: "OverClocked!",
			description: "What's that noise? OHHH MY PC",
			imageID: "75746597939007",
		});

		let hasOverClock = false;
		this.event.subscribe(Players.PlayerRemoving, (p) => {
			if (p !== player) return;
			hasOverClock = false;
		});

		this.event.subscribe(plot.placeBlocks.processed, (player, a, b) => {
			const id = plots.getPlotComponent(a.plot).ownerId.get();
			if (!id) return;

			const p = Players.GetPlayerByUserId(id);
			if (p !== player) return;

			for (const m of b.models) {
				if (BlockManager.manager.id.get(m) === LogicOverclockBlock.id) {
					hasOverClock = true;
					return;
				}
			}
		});

		this.event.subscribe(plot.deleteBlocks.processed, (player, a, b) => {
			const id = plots.getPlotComponent(a.plot).ownerId.get();
			if (!id) return;

			if (a.blocks === "all") {
				hasOverClock = false;
				return;
			}

			const p = Players.GetPlayerByUserId(id);
			if (p !== player) return;

			for (const m of a.blocks) {
				if (BlockManager.manager.id.get(m) === LogicOverclockBlock.id) {
					hasOverClock = false;
					return;
				}
			}
		});

		this.event.subscribe(CustomRemotes.modes.setOnClient.sent, () => {
			const mode = playModeController.getPlayerMode(player);
			if (mode !== "ride") return;

			this.set({ completed: hasOverClock });
		});
	}
}

abstract class AchievementCheckpoints extends Achievement<{ checkpoints_finished: string[] }> {
	constructor(
		player: Player,
		playModeController: PlayModeController,
		data: baseAchievementStats,
		triggerGroup: keyof typeof _triggers,
	) {
		super(player, data);

		this.onEnable(() => {
			const checkpoints_finished = new Set(this.getData()?.checkpoints_finished ?? []);
			const hitSequence: (BasePart | undefined)[] = [];
			const [triggersList, triggersRecord] = getTriggerList(triggerGroup);
			const listLen = triggersList.size();
			for (let i = 0; i < listLen; i++) {
				const t = triggersList[i];

				this.event.subscribe(t.Touched, (inst) => {
					//get player's mode
					// yes it DOESN'T actually check if player is in their own vehicle
					// but it doesn't matter because player doesn't know it
					if (playModeController.getPlayerMode(player) !== "ride") return;

					//check if part touched is player's
					if (inst.Parent !== player.Character) return;

					//add timeout to the trigger
					hitSequence[i] = t;
					checkpoints_finished.add(t.Name);

					//check if all triggered
					let allTriggered = true;
					for (let j = 0; j < listLen; j++) {
						const tr = hitSequence[j];

						if (tr === undefined) {
							allTriggered = false;
							break;
						}
					}

					this.set({ completed: allTriggered, checkpoints_finished: [...checkpoints_finished] });
				});
			}
		});
	}
}

//may be will be used some day
const getExtremesOfArray = (arr: number[]): LuaTuple<[number, number]> => $tuple(math.min(...arr), math.max(...arr));

abstract class AchievementCheckpointsWithTimeout extends Achievement {
	constructor(
		player: Player,
		playModeController: PlayModeController,
		data: baseAchievementStats,
		timeout_seconds: number,
		triggerGroup: keyof typeof _triggers,
	) {
		super(player, data);

		const hitSequence: (BasePart | undefined)[] = [];
		const [triggersList, triggersRecord] = getTriggerList(triggerGroup);
		const listLen = triggersList.size();
		for (let i = 0; i < listLen; i++) {
			const t = triggersList[i];

			//I believe it to be kinda clever actually
			let thread: thread;
			this.event.subscribe(t.Touched, (inst) => {
				//get player's mode
				// yes it DOESN'T actually check if player is in their own vehicle
				// but it doesn't matter because player doesn't know it
				if (playModeController.getPlayerMode(player) !== "ride") return;

				//check if part touched is player's
				if (inst.Parent !== player.Character) return;

				//add timeout to the trigger
				hitSequence[i] = t;
				if (thread) task.cancel(thread);
				thread = task.delay(timeout_seconds, () => (hitSequence[i] = undefined));

				//check if all triggered
				let allTriggered = true;
				for (let j = 0; j < listLen; j++) {
					const tr = hitSequence[j];
					if (tr === undefined) {
						allTriggered = false;
						break;
					}
				}

				this.set({ completed: allTriggered });
			});
		}
	}
}

abstract class AchievementCentrifuge extends AchievementCheckpointsWithTimeout {
	constructor(
		player: Player,
		playModeController: PlayModeController,
		name: string,
		timeout_seconds: number,
		hidden = false,
	) {
		super(
			player,
			playModeController,
			{
				id: `CENTRIFUGE_TARGET_${timeout_seconds}`,
				name,
				description: `Make a lap in the Centrifuge in ${timeout_seconds} seconds or less`,
				hidden,
				imageID: "109486075173347",
			},
			timeout_seconds,
			"Centrifuge",
		);
	}
}

@injectable
class AchievementCentrifuge30seconds extends AchievementCentrifuge {
	constructor(@inject player: Player, @inject playModeController: PlayModeController) {
		super(player, playModeController, `30 Seconds or Less`, 30);
	}
}

@injectable
class AchievementCentrifuge20seconds extends AchievementCentrifuge {
	constructor(@inject player: Player, @inject playModeController: PlayModeController) {
		super(player, playModeController, `Now We're Cooking with Gas!`, 20);
	}
}

@injectable
class AchievementCentrifuge10seconds extends AchievementCentrifuge {
	constructor(@inject player: Player, @inject playModeController: PlayModeController) {
		super(player, playModeController, `Right round like a record, baby`, 10);
	}
}

@injectable
class AchievementCentrifuge5seconds extends AchievementCentrifuge {
	constructor(@inject player: Player, @inject playModeController: PlayModeController) {
		super(player, playModeController, `KA-CHOW`, 5, true);
	}
}

abstract class AchievementAmogusTrack extends AchievementCheckpointsWithTimeout {
	constructor(
		player: Player,
		playModeController: PlayModeController,
		timeout_seconds: number,
		name: string,
		hidden = false,
		description = `Make a lap on the race track in ${timeout_seconds} seconds or less. No shortcuts.`,
	) {
		super(
			player,
			playModeController,
			{
				id: `RACE_TRACK_TARGET_${timeout_seconds}`,
				name,
				description,
				hidden,
				imageID: "103876818849553",
			},
			timeout_seconds,
			"AmogusTrack",
		);
	}
}

@injectable
class AchievementAmogusTrack20seconds extends AchievementAmogusTrack {
	constructor(@inject player: Player, @inject playModeController: PlayModeController) {
		super(player, playModeController, 20, `Minimum Viable Product`, false, `Just running a lap is a solution too`);
	}
}

@injectable
class AchievementAmogusTrack15seconds extends AchievementAmogusTrack {
	constructor(@inject player: Player, @inject playModeController: PlayModeController) {
		super(player, playModeController, 15, `Circuit Breaker`);
	}
}

@injectable
class AchievementAmogusTrack10seconds extends AchievementAmogusTrack {
	constructor(@inject player: Player, @inject playModeController: PlayModeController) {
		super(player, playModeController, 10, `TAS Bot Approved`);
	}
}

abstract class AchievementOvalTrack extends AchievementCheckpointsWithTimeout {
	constructor(
		player: Player,
		playModeController: PlayModeController,
		timeout_seconds: number,
		name: string,
		description = `Make a lap on the Oval race track in ${timeout_seconds} seconds or less. No shortcuts.`,
	) {
		super(
			player,
			playModeController,
			{
				id: `RACE_TRACK_OVALS_TARGET_${timeout_seconds}`,
				name,
				description,
				imageID: "127597860492025",
			},
			timeout_seconds,
			"OvalTrack",
		);
	}
}

@injectable
class AchievementOvalTrack20seconds extends AchievementOvalTrack {
	constructor(@inject player: Player, @inject playModeController: PlayModeController) {
		super(player, playModeController, 20, `First Lap`);
	}
}

@injectable
class AchievementOvalTrack15seconds extends AchievementOvalTrack {
	constructor(@inject player: Player, @inject playModeController: PlayModeController) {
		super(player, playModeController, 15, `Qualifying Lap`);
	}
}

@injectable
class AchievementOvalTrack10seconds extends AchievementOvalTrack {
	constructor(@inject player: Player, @inject playModeController: PlayModeController) {
		super(player, playModeController, 10, `Grind Prix`);
	}
}

@injectable
class AchievementAirRingsEasy extends AchievementCheckpoints {
	constructor(@inject player: Player, @inject playModeController: PlayModeController) {
		super(
			player,
			playModeController,
			{
				id: `AIR_COURSE_EASY`,
				name: "Flight School Graduate",
				description: `Finish easy difficulty air course`,
				imageID: "101267722343574",
			},
			"AirRingsEasy",
		);
	}
}

@injectable
class AchievementAirRingsMedium extends AchievementCheckpointsWithTimeout {
	constructor(@inject player: Player, @inject playModeController: PlayModeController) {
		super(
			player,
			playModeController,
			{
				id: `AIR_COURSE_MEDIUM`,
				name: "Through John's Heart",
				description: `Finish medium difficulty air course in 25 seconds or less`,
				imageID: "101267722343574",
			},
			25,
			"AirRingsMedium",
		);
	}
}

@injectable
class AchievementAirRingsHard extends AchievementCheckpointsWithTimeout {
	constructor(@inject player: Player, @inject playModeController: PlayModeController) {
		super(
			player,
			playModeController,
			{
				id: `AIR_COURSE_HARD`,
				name: "No Room for Error",
				description: `Finish intentionally hard air course in 60 seconds or less.. Designed to test player's skills in engineering and piloting.`,
				imageID: "101267722343574",
			},
			60,
			"AirRingsHard",
		);
	}
}

abstract class AchievementFindGetNearObject extends Achievement {
	constructor(
		player: Player,
		data: baseAchievementStats,
		targetObject: BasePart | UnionOperation | undefined,
		activationDistance: number,
	) {
		super(player, data);

		let counter = 0;
		this.event.subscribe(RunService.Heartbeat, (delta) => {
			const character = player.Character?.PrimaryPart;

			if (!character || !targetObject) {
				counter = 0;
				return;
			}

			// same result, purposefully separated conditions
			if (character.Position.sub(targetObject.Position).Magnitude > activationDistance) {
				counter = 0;
				return;
			}

			counter += delta;

			this.set({ progress: counter });
		});
	}
}

@injectable
class AchievementFindBanana extends AchievementFindGetNearObject {
	constructor(@inject player: Player) {
		super(
			player,
			{
				id: "FIND_BANANA",
				name: "Completely bananas!",
				description: "Find the banana!",
				hidden: true,
				max: 4,
				imageID: "132805406903978",
			},
			ws.Map.Banana.PrimaryPart,
			40,
		);
	}
}

@injectable
class AchievementFindUFO extends AchievementFindGetNearObject {
	constructor(@inject player: Player) {
		super(
			player,
			{
				id: "FIND_UFO",
				name: "I Want to Believe!",
				description: "Find the UFO!",
				hidden: true,
				max: 4,
				imageID: "110520480308001",
			},
			ws.Map.UFO.PrimaryPart,
			150,
		);
	}
}

// I would not be surprised if the name gets changed (I couldent think of anything else that fits)
@injectable
class BonkBonkByeBye extends Achievement {
	constructor(@inject player: Player) {
		super(player, {
			id: "MAXWELL_BONK",
			name: "Bonk bonk bye bye!",
			description: "Knock Maxwell off Big John, how rude >:(",
			// add an image if you want
			// imageID: "0",
			hidden: true,
		});

		// Maxwell not important enough for a capital name???
		const maxwell = ws.Map["Main Island"].Fun.Destructibles.FindFirstChild("maxwell") as MeshPart;
		if (!maxwell) return;

		// keep track of the last player that touched maxwell
		let maxtag = maxwell.FindFirstChild("MaxwellPlayerTag") as IntValue;
		if (!maxtag) {
			// create it
			maxtag = new Instance("IntValue", maxwell);
		}

		maxwell.Touched.Connect((hitPart)=>{
			const character = hitPart.FindFirstAncestorWhichIsA("Model");
			if (!character) return;
			const plr = Players.GetPlayerFromCharacter(character);
			// check if player exists
			if (plr && plr.UserId === player.UserId) {
				maxtag.Value = plr.UserId;
			}
		})

		this.event.subscribe(RunService.Heartbeat, ()=>{
			if (!maxwell) return;
			print(maxtag.Value)

			// this is how the game triggers *the screaming*
			// (slightly increased to make sure its falling)
			if (maxwell.AssemblyLinearVelocity.Magnitude > 20) {
				if (maxtag.Value !== player.UserId) return;
				this.set({ completed: true });
			}
		})
	}
}

@injectable
class AchievementBreakSomething extends Achievement {
	constructor(@inject player: Player) {
		super(player, {
			id: "BREAK_MAP_DESTRUCTABLE",
			name: "Breaking Change",
			description: "Break a hydrant or something, or be near when it happens",
			imageID: "79485719904367",
		});

		const activationDistance = 15;
		for (const o of ws.Map["Main Island"].Fun.Destructibles.GetChildren()) {
			if (o.Name !== "Fire Hydrant") continue;
			const obj = o as Model & {
				Main: BasePart & {
					TriggeredSound: Sound;
				};
			};

			this.event.subscribe(obj.Main.TriggeredSound.Played, () => {
				const character = player.Character?.PrimaryPart;
				if (!character) return;
				this.set({ completed: character.Position.sub(obj.Main.Position).Magnitude < activationDistance });
			});
		}
	}
}

@injectable
class AchievementFOVMax extends Achievement {
	constructor(@inject player: Player, @inject serverPlayerController: ServerPlayerController) {
		super(player, {
			id: "FOV_MAX",
			name: "Quake pro",
			description: "Set your FOV to the maximum value",
			hidden: true,
			max: 120,
			imageID: "129519370592474",
		});

		this.event.subscribe(serverPlayerController.remotes.player.updateSettings.invoked, (p, s) => {
			if (p !== player) return;
			if (!s.betterCamera?.fov) return;
			this.set({ progress: s.betterCamera.fov });
		});
	}
}

export const allAchievements: readonly ConstructorOf<Achievement>[] = [
	AchievementWelcome,
	AchievementLuaCircuitObtained,
	AchievementPlaytime1H,
	AchievementPlaytime4H,
	AchievementPlaytime12H,
	AchievementPlaytime36H,
	AchievementAfkTime,

	AchievementHeightRecord25k,
	AchievementHeightRecord75k,
	AchievementHeightRecord150k,
	AchievementHeightRecord500k,

	AchievementSpeedRecord1k,
	AchievementSpeedRecord5k,
	AchievementSpeedRecord15k,
	AchievementSpeedRecord50k,
	AchievementSpeedRecord100k,

	AchievementCatchOnFire,

	AchievementTheIssue,
	AchievementOverclock,
	AchievementFOVMax,

	// map-specific ones
	AchievementBreakSomething,
	AchievementFindBanana,
	AchievementFindUFO,
	BonkBonkByeBye,

	AchievementCentrifuge30seconds,
	AchievementCentrifuge20seconds,
	AchievementCentrifuge10seconds,
	AchievementCentrifuge5seconds,

	AchievementAmogusTrack20seconds,
	AchievementAmogusTrack15seconds,
	AchievementAmogusTrack10seconds,

	AchievementOvalTrack20seconds,
	AchievementOvalTrack15seconds,
	AchievementOvalTrack10seconds,

	AchievementAirRingsEasy,
	AchievementAirRingsMedium,
	AchievementAirRingsHard,
];
