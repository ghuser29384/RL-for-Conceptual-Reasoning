import {
  PilotEndpointServiceError,
  PilotEndpointWorkflowService,
} from "./pilot-endpoint-service.mjs";

export class ApprovedPilotEndpointWorkflowService extends PilotEndpointWorkflowService {
  async registerSelfCheckSelection(args) {
    const state = await this.state();
    if (state.ratings.length > 0) {
      throw new PilotEndpointServiceError(
        409,
        "self_check_selection_too_late",
        "The D1 self-check selection manifest must be frozen before any pilot rating is locked.",
        { lockedRatingCount: state.ratings.length },
      );
    }
    return super.registerSelfCheckSelection(args);
  }

  async lockInitialRating(args) {
    const state = await this.state();
    if (!state.selfCheckSelection) {
      throw new PilotEndpointServiceError(
        409,
        "self_check_selection_required_before_rating",
        "The approved D1 self-check selection manifest must be frozen before the first pilot rating.",
      );
    }
    return super.lockInitialRating(args);
  }
}
