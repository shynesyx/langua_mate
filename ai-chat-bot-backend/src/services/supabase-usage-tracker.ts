import supabase from "../db";
import { UsageTracker } from "./usage-tracker";

export class SupabaseUsageTracker implements UsageTracker {
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
    try {
      this.requestCount++;
      const { error } = await supabase.from("gemini_usage").insert({
        user_id: data.userId || "anonymous",
        input_tokens: data.inputTokens,
        output_tokens: data.outputTokens,
        total_tokens: data.inputTokens + data.outputTokens,
        model: data.model,
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error logging usage to Supabase:", error);
      throw error;
    }
  }

  async getUsageSummary(userId?: string): Promise<{
    totalRequests: number;
    requestsPerMinute: number;
    totalTokens: number;
    dailyTokens: number;
  }> {
    try {
      // Get total requests and tokens
      const query = supabase.from("gemini_usage").select("total_tokens");
      if (userId) {
        query.eq("user_id", userId);
      }
      const { data: usageData, error: usageError } = await query;

      if (usageError) throw usageError;

      const totalTokens = usageData.reduce(
        (sum, entry) => sum + (entry.total_tokens || 0),
        0
      );
      const totalRequests = usageData.length;

      // Get daily tokens (for today)
      const today = new Date().toISOString().split("T")[0];
      const dailyQuery = supabase
        .from("gemini_usage")
        .select("total_tokens")
        .gte("timestamp", `${today}T00:00:00Z`)
        .lte("timestamp", `${today}T23:59:59Z`);
      if (userId) {
        dailyQuery.eq("user_id", userId);
      }
      const { data: dailyData, error: dailyError } = await dailyQuery;

      if (dailyError) throw dailyError;

      const dailyTokens = dailyData.reduce(
        (sum, entry) => sum + (entry.total_tokens || 0),
        0
      );

      return {
        totalRequests,
        requestsPerMinute: this.REQUEST_LIMIT_PER_MINUTE - this.requestCount,
        totalTokens,
        dailyTokens,
      };
    } catch (error) {
      console.error("Error fetching usage summary from Supabase:", error);
      return {
        totalRequests: 0,
        requestsPerMinute: this.REQUEST_LIMIT_PER_MINUTE - this.requestCount,
        totalTokens: 0,
        dailyTokens: 0,
      };
    }
  }
}