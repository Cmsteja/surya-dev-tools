import { DependencyNode, ParsedDependencyTree } from '../types/dependencyTree';

export function parseDependencyTree(text: string): ParsedDependencyTree {
  const lines = text.split('\n');
  
  if (lines.length === 0) {
    throw new Error('Empty dependency tree text');
  }

  const nodes: ParsedLineNode[] = [];
  const uniqueDependencies = new Set<string>();
  let foundRoot = false;

  for (const line of lines) {
    const node = parseLine(line, !foundRoot);
    if (node) {
      foundRoot = true;
      nodes.push(node);
      const key = `${node.name}@${node.version}`;
      uniqueDependencies.add(key);
    }
  }

  if (nodes.length === 0) {
    throw new Error('No dependencies found in the provided text');
  }

  // Build tree structure
  const root = buildTree(nodes);
  const totalDependencies = countDependencies(root);

  return {
    root,
    totalDependencies,
    uniqueDependencies,
  };
}

interface ParsedLineNode {
  name: string;
  version: string;
  depth: number;
}

function parseLine(line: string, isFirstValidLine: boolean): ParsedLineNode | null {
  // Skip empty lines
  if (!line.trim()) {
    return null;
  }

  // Remove [INFO], [WARN], [ERROR] Maven prefixes but keep the tree indentation that follows
  const bracketMatch = /^\s*\[(?:INFO|WARN|ERROR)\]\s?(.*)$/i.exec(line);
  const afterBracket = bracketMatch ? bracketMatch[1] : line;

  const trimmedContent = afterBracket.trim();

  // Skip lines that are clearly metadata, not dependencies
  if (!trimmedContent ||
      trimmedContent.startsWith('---') ||
      /maven-dependency-plugin/i.test(trimmedContent) ||
      /^(building|scanning for projects|packages|vulnerabilities|audited|up to date|added)/i.test(trimmedContent)) {
    return null;
  }

  // Maven tree indent is made of 3-char groups ("|  " or "   ") followed by a "+- " / "\- " connector
  let cursor = 0;
  let groups = 0;
  while (cursor + 3 <= afterBracket.length) {
    const chunk = afterBracket.slice(cursor, cursor + 3);
    if (chunk === '|  ' || chunk === '   ') {
      groups++;
      cursor += 3;
    } else {
      break;
    }
  }

  const connectorChar = afterBracket[cursor];
  const hasConnector = (connectorChar === '+' || connectorChar === '\\') && afterBracket[cursor + 1] === '-';

  let depth: number;
  let rest: string;

  if (hasConnector) {
    depth = groups + 1;
    rest = afterBracket.slice(cursor + 2).trim();
  } else if (isFirstValidLine) {
    // The very first dependency line is the project's own coordinates (the tree root)
    depth = 0;
    rest = trimmedContent;
  } else {
    return null;
  }

  if (!rest) {
    return null;
  }

  // Maven/Gradle coordinates: groupId:artifactId:packaging:version[:scope]
  const coordParts = rest.split(':');
  if (coordParts.length >= 3 && coordParts[0].includes('.')) {
    const groupId = coordParts[0];
    const artifactId = coordParts[1];
    const version = coordParts[3] || coordParts[2] || 'unknown';

    return {
      name: `${groupId}:${artifactId}`,
      version,
      depth,
    };
  }

  // Fallback: npm/yarn style "package@version"
  const npmMatch = /^([^@\s]+)(?:@([^\s()]+))?/.exec(rest);
  if (npmMatch?.[1]) {
    return {
      name: npmMatch[1],
      version: npmMatch[2] || 'unknown',
      depth,
    };
  }

  return null;
}



function buildTree(nodes: ParsedLineNode[]): DependencyNode {
  if (nodes.length === 0) {
    return {
      name: 'root',
      version: '1.0.0',
      children: [],
      depth: 0,
    };
  }

  // Convert to DependencyNode
  const depNodes: DependencyNode[] = nodes.map(node => ({
    name: node.name,
    version: node.version,
    children: [],
    depth: node.depth,
  }));

  // Use first node as root
  const root = { ...depNodes[0], children: [] };
  const stack: DependencyNode[] = [root];

  for (let i = 1; i < depNodes.length; i++) {
    const current = depNodes[i];

    // Pop from stack until we find the correct parent
    while (stack.length > 1 && stack[stack.length - 1].depth >= current.depth) {
      stack.pop();
    }

    const parent = stack[stack.length - 1];
    parent.children.push(current);
    stack.push(current);
  }

  return root;
}

function countDependencies(node: DependencyNode): number {
  let count = 1;
  for (const child of node.children) {
    count += countDependencies(child);
  }
  return count;
}

export function getPathToNode(node: DependencyNode, target: DependencyNode, path: string[] = []): string[] | null {
  path.push(`${node.name}@${node.version}`);

  if (node === target) {
    return path;
  }

  for (const child of node.children) {
    const result = getPathToNode(child, target, [...path]);
    if (result) {
      return result;
    }
  }

  return null;
}
