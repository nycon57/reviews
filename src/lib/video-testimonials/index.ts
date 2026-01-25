export {
  // Actions
  createVideoTestimonialRequest,
  createBulkVideoTestimonialRequests,
  getVideoTestimonialRequests,
  getVideoTestimonialRequest,
  cancelVideoTestimonialRequest,
  resendVideoTestimonialRequest,
  getVideoTestimonialQueue,
  getUsersForVideoRequests,
  getLoanOfficersForVideoRequests, // @deprecated - use getUsersForVideoRequests
  // Queue Management Actions
  getVideoTestimonialQueueStatus,
  pauseVideoTestimonialQueue,
  resumeVideoTestimonialQueue,
  retryFailedVideoTestimonialQueueItems,
  // Types
  type ActionResult,
  type VideoTestimonialRequest,
  type CreateVideoTestimonialRequestResult,
  type BulkCreateResult,
  type VideoTestimonialQueueItem,
  type CreateVideoTestimonialRequestInput,
  type BulkCreateInput,
  type QueueStatus,
} from "./actions";

export {
  // Queue Service Functions
  processVideoTestimonialQueue,
  processVideoTestimonialQueueItem,
  getPendingVideoTestimonialQueueItems,
  getVideoTestimonialQueueStats,
  cancelPendingVideoTestimonialQueueItems,
  checkVideoTestimonialRateLimit,
  isQueuePaused,
  setQueuePaused,
  // Immediate sending (for single/small batches)
  sendInitialVideoTestimonialEmailImmediately,
  // Types
  type VideoTestimonialQueueItem as QueueServiceQueueItem,
  type VideoTestimonialRequestWithDetails,
  type QueueProcessingResult,
  type QueueStats,
} from "./queue-service";

export {
  // Public Actions
  getVideoTestimonialByToken,
  submitCustomerInfoAndConsent,
} from "./public-actions";

// Export shared types and constants from types.ts
export {
  type PublicVideoTestimonialRequest,
  type CustomerInfoInput,
  type ConsentInput,
  type RelationshipType,
  type SubmitCustomerInfoInput,
  VALID_RELATIONSHIPS,
  IMMEDIATE_SEND_THRESHOLD,
} from "./types";
