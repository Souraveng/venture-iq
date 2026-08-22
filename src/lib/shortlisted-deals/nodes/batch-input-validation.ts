import { BatchPipelineState } from "../contracts";

export async function runBatchInputValidation(state: typeof BatchPipelineState.State) {
  const batch = state.input;

  if (!batch || batch.length === 0) {
    throw new Error("No deal cards provided in the batch input.");
  }

  // Fast deterministic check
  const invalidDeals = batch.filter(
    deal => !deal.id || !deal.startupName || !deal.sector || !deal.founders || deal.founders.length === 0
  );

  if (invalidDeals.length > 0) {
    throw new Error(`Batch contains ${invalidDeals.length} deals with missing required fields (id, startupName, sector, or founders).`);
  }

  // Return empty state update as we just validated
  return {};
}
