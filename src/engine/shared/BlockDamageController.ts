import { Players, RunService } from "@rbxts/services";
import { HostedService } from "engine/shared/di/HostedService";
import { RemoteEvents } from "shared/RemoteEvents";
import { CustomRemotes } from "shared/Remotes";
import type { GameHostBuilder } from "engine/shared/GameHostBuilder";

export type damageType = Partial<{
	//ansolute units
	heatDamage: number;
	impactDamage: number;
	explosiveDamage: number;
}>;

type health = number;

const blockMaxHealthList = new Map<BlockModel, health>();
const blockHealthList = new Map<BlockModel, health>();

const checkIfCanBeUnwelded = (damage: number, blockHealth: number) => blockHealth > 0 && damage > blockHealth / 4;
const checkIfCanBeDestroyed = (damage: number, blockHealth: number) => blockHealth > 0 && damage > blockHealth;
const testYourLuck = (num: number): boolean => math.random() < num;
const explode = (part: BasePart, radius: number) =>
	RemoteEvents.Explode.send({
		part,
		radius,
		pressure: 1,
		isFlammable: false,
	});

// handle block health init here
if (RunService.IsServer()) {
	Players.PlayerAdded.Connect((p) => {
		const dmg = blockHealthList.map((block, health) => ({ block, health }));
		CustomRemotes.damageSystem.healthInit.send(p, dmg);
	});
}

if (RunService.IsClient()) {
	CustomRemotes.damageSystem.healthInit.invoked.Connect((arr) => {
		for (const v of arr) blockHealthList.set(v.block, v.health);
	});
}

export class BlockDamageController extends HostedService {
	static initialize(host: GameHostBuilder) {
		host.services.registerService(this);
	}

	constructor() {
		super();

		if (RunService.IsServer()) {
			CustomRemotes.damageSystem.damageBlock.received.Connect((player, { block, damage }) => {
				this.applyDamage(block, damage);
				// mb just do something with the player here
			});
		}
	}

	getHealth(block: BlockModel) {
		return blockHealthList.get(block);
	}

	/** @server */
	initHealth(block: BlockModel) {
		const magicNumber = 18;
		const pp = block.PrimaryPart;
		if (!pp) throw "Trying to init block health with no PrimaryPart";

		const blockHealth =
			(pp.Mass * pp.CurrentPhysicalProperties.Elasticity * pp.CurrentPhysicalProperties.ElasticityWeight) /
			magicNumber;

		blockHealthList.set(block, blockHealth);
		blockMaxHealthList.set(block, blockHealth);
	}

	applyDamage(block: BlockModel, damage: damageType) {
		const { explosiveDamage = 0, impactDamage = 0, heatDamage = 0 } = damage;

		if (RunService.IsClient()) {
			//sync damage with other players and server
			CustomRemotes.damageSystem.damageBlock.send({ block, damage });
			return;
		}

		const currentHealth = blockHealthList.get(block);
		if (!currentHealth || currentHealth <= 0) return;

		const maxHealth = blockMaxHealthList.get(block);
		if (!maxHealth) return;

		const pp = block.PrimaryPart;
		if (!pp) throw "Trying to apply damage to a block with no PrimaryPart";

		const material = block.PrimaryPart!;
		const totalDamage = heatDamage + impactDamage + explosiveDamage;

		if (checkIfCanBeDestroyed(totalDamage, currentHealth)) {
			blockHealthList.delete(block);
			block.Destroy(); //destroy here
			// the only case when else if useful
		} else if (checkIfCanBeUnwelded(totalDamage, currentHealth)) {
			//unweld here
			RemoteEvents.ImpactBreak.send(block.GetDescendants().filter((v) => v.IsA("BasePart")));
		}

		// dunno what to do with the explosions so far
		// each explosion probably destroys welds
		if (explosiveDamage > 0) explode(pp, explosiveDamage); //explode here

		const ignitionChance = //
			//basically density == chance, because density can't be bigger than 100, right? right..?
			// (1 - (density[0.01...100] / 100)) * fireChance
			(1 - material.CurrentPhysicalProperties.Density / 100) * math.clamp(heatDamage, 0, 1);

		if (testYourLuck(ignitionChance)) {
			RemoteEvents.Burn.send(block.GetDescendants().filter((v) => v.IsA("BasePart"))); //put on fire here
		}
	}
}
