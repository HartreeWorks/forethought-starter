// Stub for AI run execution tracking.
// AI evaluation runs are not yet implemented — these stubs allow
// the run detail route to compile and work for human runs.

const executingRuns = new Set<string>();

export function isRunExecuting(runId: string): boolean {
  return executingRuns.has(runId);
}

export function stopRunExecution(runId: string): void {
  executingRuns.delete(runId);
}
