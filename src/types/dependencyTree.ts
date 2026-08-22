export interface DependencyNode {
  name: string;
  version: string;
  children: DependencyNode[];
  depth: number;
}

export interface ParsedDependencyTree {
  root: DependencyNode;
  totalDependencies: number;
  uniqueDependencies: Set<string>;
}
