import ts from "typescript";

const create = (program: ts.Program, context: ts.TransformationContext) => {
	const factory = ts.factory;

	/** Fix namespace function hoisting by moving any variable and inside namespace declarations to the bottom */
	const transformNamespaces = (file: ts.SourceFile): ts.SourceFile => {
		const fixNamespace = (node: ts.ModuleDeclaration): ts.ModuleDeclaration => {
			if ((node.flags & ts.NodeFlags.Namespace) === 0 || !node.body || !ts.isModuleBlock(node.body))
				return node;

			const functionDeclarations: ts.FunctionDeclaration[] = [];
			const namespaceDeclarations: ts.ModuleDeclaration[] = [];
			const anyDeclarations: ts.Statement[] = [];

			for (const child of node.body.statements) {
				if (ts.isFunctionDeclaration(child)) {
					functionDeclarations.push(child);
				} else if (ts.isModuleDeclaration(child)) {
					namespaceDeclarations.push(child);
				} else {
					anyDeclarations.push(child);
				}
			}

			return ts.factory.createModuleDeclaration(
				node.modifiers,
				node.name,
				ts.factory.createModuleBlock([
					...functionDeclarations,
					...anyDeclarations,
					...namespaceDeclarations,
				]),
				node.flags,
			);
		}

		return ts.visitEachChild(file, node => {
			if (ts.isModuleDeclaration(node)) {
				return fixNamespace(node);
			}

			return node;
		}, context);
	}
	const transformLogs = (file: ts.SourceFile): ts.SourceFile => {
		let needsImport = false;
		const scopedBlocks = new Set<(ts.Block | ts.SourceFile)>();

		const constructLog = (expression: ts.CallExpression, name: string): ts.Node => {
			needsImport = true;

			return factory.createCallExpression(
				factory.createPropertyAccessExpression(
					factory.createIdentifier('__logger'),
					factory.createIdentifier(`_${name}`),
				),
				expression.typeArguments,
				[
					factory.createArrayLiteralExpression([

						factory.createStringLiteral('\t -'),
						factory.createIdentifier('script'),
						factory.createStringLiteral(`:${file.getLineAndCharacterOfPosition(expression.getStart()).line}`),
					]),
					...expression.arguments,
				],
			);
		};
		const constructScope = (expression: ts.CallExpression): ts.Node => {
			needsImport = true;

			let parent = expression.parent;
			while (parent && !ts.isBlock(parent) && !ts.isSourceFile(parent)) {
				parent = parent.parent;
			}
			if (!parent) throw 'what';
			if (!ts.isBlock(parent) && !ts.isSourceFile(parent)) throw 'what';

			scopedBlocks.add(parent);

			return factory.createCallExpression(
				factory.createPropertyAccessExpression(
					factory.createIdentifier('__logger'),
					factory.createIdentifier(`beginScope`),
				),
				expression.typeArguments,
				expression.arguments,
			);
		};

		const visit = (node: ts.Node): ts.Node => {
			if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
				if (node.expression.text === "$log") {
					return constructLog(node, "info");
				}
				if (node.expression.text === "$warn") {
					return constructLog(node, "warn");
				}
				if (node.expression.text === "$err") {
					return constructLog(node, "err");
				}
			
				if (node.expression.text === "$beginScope") {
					return constructScope(node);
				}
			}

			return ts.visitEachChild(node, visit, context);
		};

		const addTryCatch = (statements: readonly ts.Statement[]): ts.TryStatement => {
			statements = [...statements];
			return factory.createTryStatement(
				factory.createBlock(statements),
				undefined,
				factory.createBlock([
					factory.createExpressionStatement(
						factory.createCallExpression(
							factory.createPropertyAccessExpression(
								factory.createIdentifier('__logger'),
								factory.createIdentifier(`endScope`),
							),
							undefined,
							undefined,
						),
					),
				]),
			);
		}

		const addEndScopes = (node: ts.Node): ts.Node => {
			if (ts.isBlock(node) || ts.isSourceFile(node)) {
				for (const child of node.statements) {
					if (ts.isExpressionStatement(child) && ts.isCallExpression(child.expression) && ts.isIdentifier(child.expression.expression) && child.expression.expression.text === '$beginScope') {
						needsImport = true;

						if (ts.isBlock(node)) {
							return addTryCatch((ts.visitEachChild(node, addEndScopes, context) as ts.Block).statements);
						}
						else if (ts.isSourceFile(node)) {
							if (true as boolean)
								throw 'Logger scoping outside of blocks is not supported!'
							return factory.updateSourceFile(
								node,
								[addTryCatch(ts.visitEachChild(node, addEndScopes, context).statements)],
								node.isDeclarationFile,
								node.referencedFiles,
								node.typeReferenceDirectives,
								node.hasNoDefaultLib,
								node.libReferenceDirectives,
							);
						}
					}
				}
			}

			return ts.visitEachChild(node, addEndScopes, context);
		};
		
		file = addEndScopes(file) as ts.SourceFile;
		file = ts.visitEachChild(file, visit, context);
		if (needsImport) {
			file = factory.updateSourceFile(
				file,
				[
					factory.createImportDeclaration(
						undefined,
						factory.createImportClause(
							false,
							undefined,
							factory.createNamedImports([
								factory.createImportSpecifier(
									false,
									factory.createIdentifier("Logger"),
									factory.createIdentifier("__logger"),
								),
							]),
						),
						factory.createStringLiteral("shared/Logger"),
					),
					...file.statements,
				],
				file.isDeclarationFile,
				file.referencedFiles,
				file.typeReferenceDirectives,
				file.hasNoDefaultLib,
				file.libReferenceDirectives,
			);
		}

		return file;
	}

	return (file: ts.SourceFile): ts.SourceFile => {
		file = transformNamespaces(file);
		file = transformLogs(file);

		return file;
	}
}

export default function (program: ts.Program) {
	return (context: ts.TransformationContext) => create(program, context);
}
