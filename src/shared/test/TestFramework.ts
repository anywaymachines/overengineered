import { Players, ReplicatedStorage, RunService, ServerScriptService } from "@rbxts/services";

export namespace TestFramework {
	export function findAllTestScripts(): readonly ModuleScript[] {
		const ret: ModuleScript[] = [];
		const visit = (instance: Instance) => {
			if (instance.IsA("ModuleScript") && instance.Name.find(".test")[0]) {
				ret.push(instance);
			}

			for (const child of instance.GetChildren()) {
				visit(child);
			}
		};

		if (RunService.IsServer()) {
			visit(ReplicatedStorage);
			visit(ServerScriptService);
		} else if (RunService.IsClient()) {
			visit(ReplicatedStorage);
			visit(Players.LocalPlayer.WaitForChild("PlayerScripts"));
		}

		return ret;
	}

	export type Tests = { readonly [k in string]: Tests } | ((di?: ReadonlyDIContainer) => void);
	export function loadTestsFromScript(mscript: ModuleScript): Tests {
		const ts = require(
			ReplicatedStorage.WaitForChild("rbxts_include").WaitForChild("RuntimeLib") as ModuleScript,
		) as {
			import: (context: LuaSourceContainer, module: Instance, ...path: string[]) => unknown;
		};

		return (ts.import(script, mscript) as { _Tests: Tests })._Tests;
	}

	export function run(name: string, test: Tests, di: ReadonlyDIContainer) {
		const run = (name: string, test: Tests, offset: number) => {
			const offsetstr = string.rep(" ", offset);
			$log(`${offsetstr}[${name}] Running`);

			if (typeIs(test, "function")) {
				try {
					test(di);
					return;
				} catch (err) {
					$err(tostring(err ?? "Unknown error"));
					return;
				}
			}

			for (const [name, tests] of pairs(test)) {
				run(name, tests, offset + 1);
			}

			$log(`${offsetstr}[${name}] SUCCESS`);
		};

		run(name, test, 0);
	}
}
