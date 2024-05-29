import path from "path";
import ts from "typescript";

const create = (program: ts.Program, context: ts.TransformationContext) => {
	const factory = ts.factory;
	const typeChecker = program.getTypeChecker();

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
					namespaceDeclarations.push(fixNamespace(child));
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

		const constructLog = (expression: ts.CallExpression, logType: string): ts.Node => {
			needsImport = true;
			const spt = file.fileName.split('/');
			let fileName = spt[spt.length - 1];
			fileName = fileName.substring(0, fileName.length - '.ts'.length);

			return factory.createCallExpression(
				factory.createPropertyAccessExpression(
					factory.createIdentifier('__logger'),
					factory.createIdentifier(`_${logType}`),
				),
				expression.typeArguments,
				[
					factory.createStringLiteral(`\t - ${fileName}:${file.getLineAndCharacterOfPosition(expression.getStart()).line}`),
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
	const transformDI = (file: ts.SourceFile): ts.SourceFile => {
		const identifierByTypeNode = (typeNode: ts.TypeNode) =>
			identifierByType(typeChecker.getTypeFromTypeNode(typeNode));
		const identifierByType = (type: ts.Type) => {
			if (!type?.symbol?.valueDeclaration) return;

			const pth = path.relative("src", type.symbol.valueDeclaration.getSourceFile().fileName)
			return pth + "$" + type.symbol.name;
		};

		const modifyParameters = (clazz: ts.ClassDeclaration): ts.ClassDeclaration => {
			if (!clazz.name) return clazz;
			if (!clazz.modifiers?.find(m => ts.isDecorator(m) && ts.isIdentifier(m.expression) && m.expression.text === 'injectable')) {
				return clazz;
			}

			type decl = {
				readonly name: ts.Identifier;
				readonly type: ts.TypeReferenceNode;
			}
			let added: decl[] = [];
			let classsymb: ts.Symbol | undefined = undefined;
			let constr: ts.ConstructorDeclaration | undefined = undefined;

			for (const ctor of clazz.members) {
				if (ts.isConstructorDeclaration(ctor)) {
					constr = ctor;

					for (const parameter of ctor.parameters) {
						if (!parameter.modifiers || parameter.modifiers.length === 0) {
							if (added && added.length !== 0) {
								throw 'Can not have @inject declarations before non-inject ones';
							}

							continue;
						}

						for (const decorator of parameter.modifiers) {
							if (!ts.isDecorator(decorator)) continue;
							if (!ts.isIdentifier(decorator.expression)) continue;
							if (decorator.expression.text !== 'inject') continue;
							if (!ts.isIdentifier(parameter.name)) continue;
							if (!parameter.type || !ts.isTypeReferenceNode(parameter.type)) continue;
							if (!ts.isIdentifier(parameter.type.typeName)) continue;

							classsymb ??= program.getTypeChecker().getSymbolAtLocation(clazz.name);
							if (!classsymb) {
								throw `Could not find symbol for class ${clazz.name.text}`;
							}

							added ??= [];
							identifierByTypeNode(parameter.type);
							added.push({
								name: parameter.name,
								type: parameter.type,
							});
						}
					}
				}
			}

			if (added.find(a => !identifierByTypeNode(a.type)))
				return clazz;

			return ts.factory.createClassDeclaration(
				clazz.modifiers?.filter(m => !(ts.isDecorator(m) && ts.isIdentifier(m.expression) && m.expression.text === 'injectable')),
				clazz.name,
				clazz.typeParameters,
				clazz.heritageClauses,
				[
					factory.createMethodDeclaration(
						[factory.createToken(ts.SyntaxKind.StaticKeyword)],
						undefined,
						factory.createIdentifier("_depsCreate"),
						undefined,
						undefined,
						[
							...(constr?.parameters.filter(p => !added.find(a => a.name.text === (p.name as ts.Identifier).text)) ?? [])
								.map(p => ts.factory.createParameterDeclaration(
									p.modifiers?.filter(m => m.kind !== ts.SyntaxKind.PrivateKeyword && m.kind !== ts.SyntaxKind.ReadonlyKeyword),
									p.dotDotDotToken,
									p.name,
									p.questionToken,
									p.type,
									p.initializer,
								)),
							factory.createParameterDeclaration(
								undefined,
								undefined,
								factory.createIdentifier("deps"),
								undefined,
								factory.createTypeReferenceNode(
									factory.createIdentifier("DIContainer"),
									undefined,
								),
								undefined,
							),
						],
						factory.createTypeReferenceNode(clazz.name, undefined),
						factory.createBlock(
							[
								factory.createReturnStatement(
									factory.createNewExpression(
										clazz.name,
										undefined,
										[
											...(constr?.parameters.filter(p => !added.find(a => a.name.text === (p.name as ts.Identifier).text)).map(p => p.name as ts.Identifier) ?? []),
											...added.map(a =>
												factory.createCallExpression(
													factory.createPropertyAccessExpression(
														factory.createIdentifier("deps"),
														factory.createIdentifier("resolve"),
													),
													[a.type],
													[factory.createStringLiteral(identifierByTypeNode(a.type)!)],
												),
											),
										],
									),
								),
							],
							true,
						),
					),
					...clazz.members.map(m => {
						if (!ts.isConstructorDeclaration(m)) return m;

						return ts.factory.createConstructorDeclaration(
							m.modifiers,
							m.parameters.map(p => ts.factory.createParameterDeclaration(
								p.modifiers?.filter(m => !(ts.isDecorator(m) && ts.isIdentifier(m.expression) && m.expression.text === 'inject')),
								p.dotDotDotToken,
								p.name,
								p.questionToken,
								p.type,
								p.initializer,
							)),
							m.body,
						)
					}),
				],
			);
		};
		const modifyRegistration = (node: ts.Node): ts.Node | undefined => {
			if (!ts.isCallExpression(node)) return;
			if (!ts.isPropertyAccessExpression(node.expression)) return;
			if (!ts.isIdentifier(node.expression.name)) return;

			const tp = typeChecker.getTypeAtLocation(node.expression.expression);
			if (tp.symbol?.name !== 'DIContainer') return;

			if (node.expression.name.text.startsWith('register')) {
				const signature = typeChecker.getResolvedSignature(node);
				if (!signature) return;

				const type = typeChecker.getTypeOfSymbolAtLocation(signature.getParameters()[0], node);
				const identifier = identifierByType(type);
				if (!identifier) return;

				return ts.factory.createCallExpression(
					node.expression,
					node.typeArguments,
					[
						...node.arguments,
						ts.factory.createStringLiteral(identifier),
					],
				)
			}
			if (node.expression.name.text.startsWith('resolve')) {
				if (!node.typeArguments || node.typeArguments.length === 0) return;

				const type = typeChecker.getTypeFromTypeNode(node.typeArguments[0]);
				const identifier = identifierByType(type);
				if (!identifier) return;

				return ts.factory.createCallExpression(
					node.expression,
					node.typeArguments,
					[
						...node.arguments,
						ts.factory.createStringLiteral(identifier),
					],
				)
			}
		};

		const visit = (node: ts.Node): ts.Node => {
			if (ts.isClassDeclaration(node) && node.name) {
				node = modifyParameters(node);
			}

			node = modifyRegistration(node) ?? node;

			return ts.visitEachChild(node, visit, context);
		};

		return ts.visitEachChild(file, visit, context);
	}

	return (file: ts.SourceFile): ts.SourceFile => {
		file = transformNamespaces(file);
		file = transformLogs(file);
		file = transformDI(file);

		return file;
	}
}

export default function (program: ts.Program) {
	return (context: ts.TransformationContext) => create(program, context);
}
