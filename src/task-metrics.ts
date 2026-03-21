import {
  EfficiencySummary,
  ScopeCoverageSummary,
  TagCoverageSummary,
  TaskEfficiency,
  TaskScope,
  TaskTaxonomy,
  TaxonomyCoverageSummary,
} from "./types";
import { roundTo } from "./utils";

function sortScopes(scopes: Map<TaskScope, number>): ScopeCoverageSummary[] {
  return [...scopes.entries()]
    .map(([scope, count]) => ({ scope, count }))
    .sort((a, b) => a.scope.localeCompare(b.scope));
}

function sortTags(tags: Map<string, number>): TagCoverageSummary[] {
  return [...tags.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
}

export function buildTaxonomyCoverageSummary(
  entries: Array<{ taxonomy?: TaskTaxonomy }>,
): TaxonomyCoverageSummary {
  const scopes = new Map<TaskScope, number>();
  const tags = new Map<string, number>();
  let tasksWithTaxonomy = 0;

  for (const entry of entries) {
    if (!entry.taxonomy) {
      continue;
    }
    tasksWithTaxonomy += 1;
    scopes.set(entry.taxonomy.scope, (scopes.get(entry.taxonomy.scope) ?? 0) + 1);
    for (const tag of entry.taxonomy.tags) {
      tags.set(tag, (tags.get(tag) ?? 0) + 1);
    }
  }

  return {
    tasksWithTaxonomy,
    tasksWithoutTaxonomy: entries.length - tasksWithTaxonomy,
    scopes: sortScopes(scopes),
    tags: sortTags(tags),
  };
}

export function buildEfficiencySummary(
  entries: Array<{ efficiency?: TaskEfficiency }>,
): EfficiencySummary {
  const measured = entries.flatMap((entry) => (entry.efficiency ? [entry.efficiency] : []));
  const measuredTasks = measured.length;
  const totalAgentDurationMs = measured.reduce((sum, entry) => sum + entry.agentDurationMs, 0);
  const totalFilesChanged = measured.reduce((sum, entry) => sum + entry.filesChanged, 0);
  const totalChangedLines = measured.reduce((sum, entry) => sum + entry.changedLines, 0);
  const totalInsertions = measured.reduce((sum, entry) => sum + entry.insertions, 0);
  const totalDeletions = measured.reduce((sum, entry) => sum + entry.deletions, 0);

  return {
    measuredTasks,
    averageAgentDurationMs: roundTo(
      measuredTasks === 0 ? 0 : totalAgentDurationMs / measuredTasks,
      2,
    ),
    averageFilesChanged: roundTo(measuredTasks === 0 ? 0 : totalFilesChanged / measuredTasks, 2),
    averageChangedLines: roundTo(
      measuredTasks === 0 ? 0 : totalChangedLines / measuredTasks,
      2,
    ),
    totalInsertions,
    totalDeletions,
  };
}
