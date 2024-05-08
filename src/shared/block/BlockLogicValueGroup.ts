interface BL<T> {
	readonly holderId: string;
	readonly connections: readonly T[];
}
interface Block<T> {
	readonly id: string;
	readonly values: readonly T[];
	readonly children: Block<T>[];
}

/** From a circular connection, remove items that are not the part of the actual circlularity */
const filterActualCircular = <B extends { readonly children: readonly B[] }>(items: ReadonlySet<B>): Set<B> => {
	const deleted = new Set<B>();

	let cont = true;
	while (cont) {
		cont = false;

		for (const item of items) {
			if (deleted.has(item)) continue;

			if (item.children.size() === 0 || item.children.all((item) => deleted.has(item))) {
				deleted.add(item);
				cont = true;
			}
		}
	}

	return items.filterToSet((item) => !deleted.has(item));
};

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
						children: [],
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
						block.children.push(blocksByConnections.get(connection)!);
					}
				}
			}

			return blocks;
		};
		const findRoots = (values: readonly B[]): B[] => {
			const findWithoutParents = (values: readonly B[]): B[] => {
				const hasParents = new Set<B>();
				for (const value of values) {
					for (const child of value.children) {
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
					visitChildren(result, value.children);
				}
			};
			const groupCircularConnections = (values: readonly B[]): Set<B>[] => {
				const addAllConnected = (result: Set<B>, value: B): void => {
					if (result.has(value)) {
						return;
					}

					result.add(value);
					for (const child of value.children) {
						addAllConnected(result, child);
					}
				};

				const rest = new Set(values);
				const groups: Set<B>[] = [];
				for (const value of filterActualCircular(rest)) {
					if (!rest.has(value)) {
						continue;
					}

					const group = new Set<B>();
					addAllConnected(group, value);
					groups.push(group);

					for (const item of group) {
						rest.delete(item);
					}
				}

				return groups;
			};
			const pickRootFromCircularGroup = (group: ReadonlySet<B>): B => {
				let min: B = undefined!;
				const actualCircular = filterActualCircular(group);

				for (const item of actualCircular) {
					if (item.children.size() === 0) {
						continue;
					}

					if (!min) {
						min = item;
						continue;
					}

					if (item.children.size() !== 0 && min.id > item.id) {
						min = item;
					}
				}

				for (const item of actualCircular) {
					const index = item.children.indexOf(min);
					if (index !== -1) {
						item.children.remove(index);
					}
				}

				return min;
			};

			const roots = findWithoutParents(values);
			const visited = new Set<B>();
			visitChildren(visited, roots);

			const unvisited = values.filter((v) => !visited.has(v));
			const groupedCircular = groupCircularConnections(unvisited);
			const circularRoots = groupedCircular.map(pickRootFromCircularGroup);

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

				for (const child of value.children) {
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

		print(order);
		return order;
	}
}

export const _Internal = {
	...BlockLogicValueGroup,
	filterActualCircular,
} as const;
