// Interface for usage tracking
export interface UsageTracker {
    logUsage(data: {
      userId: string;
      message: string;
      inputTokens: number;
      outputTokens: number;
      model: string;
    }): Promise<void>;
  
    getUsageSummary(userId?: string): Promise<{
      totalRequests: number;
      requestsPerMinute: number;
      totalTokens: number;
      dailyTokens: number;
    }>;
  }
  
  // Simple in-memory tracker for fallback or testing
  export class InMemoryUsageTracker implements UsageTracker {
    private requests: Array<{
      userId: string;
      message: string;
      inputTokens: number;
      outputTokens: number;
      model: string;
      timestamp: string;
    }> = [];
    private requestCount = 0;
    private readonly REQUEST_LIMIT_PER_MINUTE = 15;
  
    constructor() {
      // Reset request count every minute
      setInterval(() => {
        this.requestCount = 0;
      }, 60 * 1000);
    }
  
    async logUsage(data: {
      userId: string;
      message: string;
      inputTokens: number;
      outputTokens: number;
      model: string;
    }): Promise<void> {
      this.requestCount++;
      this.requests.push({
        ...data,
        timestamp: new Date().toISOString(),
      });
    }
  
    async getUsageSummary(userId?: string): Promise<{
      totalRequests: number;
      requestsPerMinute: number;
      totalTokens: number;
      dailyTokens: number;
    }> {
      const filteredRequests = userId
        ? this.requests.filter((req) => req.userId === userId)
        : this.requests;
  
      const totalRequests = filteredRequests.length;
      const totalTokens = filteredRequests.reduce(
        (sum, entry) => sum + entry.inputTokens + entry.outputTokens,
        0
      );
  
      const today = new Date().toISOString().split("T")[0];
      const dailyTokens = filteredRequests
        .filter((entry) => entry.timestamp.startsWith(today))
        .reduce((sum, entry) => sum + entry.inputTokens + entry.outputTokens, 0);
  
      return {
        totalRequests,
        requestsPerMinute: this.REQUEST_LIMIT_PER_MINUTE - this.requestCount,
        totalTokens,
        dailyTokens,
      };
    }
  }