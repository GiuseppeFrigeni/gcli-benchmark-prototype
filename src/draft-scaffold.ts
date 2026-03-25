import { TaskSuite, TaskTaxonomy, VerificationConfig } from "./types";

export const DRAFT_TASK_SUITE: TaskSuite = "contributor-workflows";

export const DRAFT_TASK_TAXONOMY: TaskTaxonomy = {
  scope: "multi-file",
  tags: ["draft-task", "chat-log-derived"],
};

export const DRAFT_TASK_PROMPT_ADDENDUM =
  "Generated from chat-log.json. Tighten instructions, fixtures, and verification before adding to the suite.";

export const DRAFT_TASK_VERIFICATION: VerificationConfig = {
  failToPass: ['node -e "process.exit(1)"'],
  passToPass: ['node -e "process.exit(0)"'],
};

export const DRAFT_WORKSPACE_README = "# Draft workspace fixture\n";
export const DRAFT_PROMPT_OUTPUT_PLACEHOLDER = "TODO: replace with expected output\n";
export const DRAFT_TOOL_USE_PLACEHOLDER = "TODO: replace with expected tool-use answer\n";
