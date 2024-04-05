import { Assert } from "shared/Assert";

interface BL<T> {
	readonly holderId: string;
	readonly connections: readonly T[];
}
interface Block<T> {
	readonly id: string;
	readonly values: readonly T[];
	readonly connections: Block<T>[];
}

export namespace BlockLogicValueGroup {
	export function group<BLV extends BL<BLV>>(
		values: readonly BLV[],
	): readonly (readonly { readonly id: string }[])[] {
		type B = Block<BLV>;

		const convertToBlocks = (values: readonly BLV[]): B[] => {
			const blocks = values
				.groupBy((v) => v.holderId)
				.map(
					(id, values): B => ({
						id,
						values,
						connections: [],
					}),
				);

			const blocksByConnections = new Map<BLV, B>();
			for (const block of blocks) {
				for (const value of block.values) {
					blocksByConnections.set(value, block);
				}
			}

			for (const block of blocks) {
				for (const value of block.values) {
					for (const connection of value.connections) {
						block.connections.push(blocksByConnections.get(connection)!);
					}
				}
			}

			return blocks;
		};
		const findRoots = (values: readonly B[]): B[] => {
			const findWithoutParents = (values: readonly B[]): B[] => {
				const hasParents = new Set<B>();
				for (const value of values) {
					for (const child of value.connections) {
						hasParents.add(child);
					}
				}

				return values.filter((v) => !hasParents.has(v));
			};
			const visitChildren = (result: Set<B>, values: readonly B[]): void => {
				for (const value of values) {
					if (result.has(value)) {
						continue;
					}

					result.add(value);
					visitChildren(result, value.connections);
				}
			};
			const groupCircularConnections = (values: readonly B[]): Set<B>[] => {
				const addAllConnected = (result: Set<B>, value: B): void => {
					if (result.has(value)) {
						return;
					}

					result.add(value);
					for (const child of value.connections) {
						addAllConnected(result, child);
					}
				};

				let rest = new Set(values);
				const groups: Set<B>[] = [];
				for (const value of values) {
					if (!rest.has(value)) {
						continue;
					}

					const group = new Set<B>();
					groups.push(group);
					addAllConnected(group, value);

					rest = rest.filterToSet((v) => !groups.any((g) => g.has(v)));
				}

				return groups;
			};
			const pickRootFromCircularGroup = (group: ReadonlySet<B>): B => {
				let min: B = undefined!;
				for (const item of group) {
					if (!min) {
						min = item;
						continue;
					}

					if (item.connections.size() !== 0 && min.id > item.id) {
						min = item;
					}
				}

				for (const item of group) {
					const index = item.connections.indexOf(min);
					if (index !== -1) {
						item.connections.remove(index);
					}
				}

				return min;
			};

			const roots = findWithoutParents(values);
			const visited = new Set<B>();
			visitChildren(visited, roots);

			const unvisited = values.filter((v) => !visited.has(v));
			const groupedCircular = groupCircularConnections(unvisited);
			const circularRoots = groupedCircular.map((g) => pickRootFromCircularGroup(g));

			return [...roots, ...circularRoots];
		};
		const calculateOrder = (values: readonly B[]): B[][] => {
			const calc = (numbers: Map<B, number>, value: B, visited: Set<B>, index = 0) => {
				if (visited.has(value)) {
					return;
				}
				visited.add(value);

				const existing = numbers.get(value);
				if (existing === undefined || existing < index) {
					numbers.set(value, index);
				}

				for (const child of value.connections) {
					calc(numbers, child, visited, index + 1);
				}
			};

			const numbers = new Map<B, number>();
			for (const value of values) {
				calc(numbers, value, new Set());
			}

			const order: B[][] = [];
			for (const [block, index] of numbers) {
				(order[index] ??= []).push(block);
			}

			return order;
		};

		// find all without parents = roots
		// from all roots, search every connected; mark as visited
		// any unvisited means circular connection
		// from all unvisited, find the connected groups
		// for every group, mark the one with the lowest UUID (for consistency) as root
		// calculate the numbers

		const blocks = convertToBlocks(values);
		const roots = findRoots(blocks);
		const order = calculateOrder(roots);

		return order;
	}
}

const test = () => {
	type BL = {
		readonly holderId: string;
		connections: readonly BL[];
	};

	// 1 => 1
	{
		const l1: BL = {
			holderId: "1",
			connections: [],
		};
		l1.connections = [l1];

		const grouping = BlockLogicValueGroup.group([l1]);
		print("grouping", grouping);

		Assert.equals(grouping.size(), 1);
		Assert.equals(grouping[0].size(), 1);
		Assert.equals(grouping[0][0].id, l1.holderId);

		print("DONE1");
	}

	// 1 => 2
	{
		const l1: BL = {
			holderId: "1",
			connections: [],
		};
		const l2: BL = {
			holderId: "2",
			connections: [],
		};
		l1.connections = [l2];

		const grouping = BlockLogicValueGroup.group([l1, l2]);
		print("grouping", grouping);

		Assert.equals(grouping.size(), 2);
		Assert.equals(grouping[0].size(), 1);
		Assert.equals(grouping[1].size(), 1);
		Assert.equals(grouping[0][0].id, l1.holderId);
		Assert.equals(grouping[1][0].id, l2.holderId);

		print("DONE2");
	}

	// 1 => 1`
	{
		const l1: BL = {
			holderId: "1",
			connections: [],
		};
		const l2: BL = {
			holderId: "1",
			connections: [],
		};
		l1.connections = [l2];

		const grouping = BlockLogicValueGroup.group([l1, l2]);
		print("grouping", grouping);

		Assert.equals(grouping.size(), 1);
		Assert.equals(grouping[0].size(), 1);
		Assert.equals(grouping[0][0].id, l1.holderId);

		print("DONE3");
	}

	// 1 => 2 => 1
	{
		const l1: BL = {
			holderId: "1",
			connections: [],
		};
		const l2: BL = {
			holderId: "2",
			connections: [],
		};
		l1.connections = [l2];
		l2.connections = [l1];

		const grouping = BlockLogicValueGroup.group([l1, l2]);
		print("grouping", grouping);

		Assert.equals(grouping.size(), 2);
		Assert.equals(grouping[0].size(), 1);
		Assert.equals(grouping[1].size(), 1);
		Assert.equals(grouping[0][0].id, l1.holderId);
		Assert.equals(grouping[1][0].id, l2.holderId);

		print("DONE4");
	}
};
