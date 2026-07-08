import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type BotCategory = "search" | "llm" | "agent" | "unknown";

export interface AgentDetection {
  botName: string;
  category: BotCategory;
}

interface BotRule extends AgentDetection {
  patterns: RegExp[];
}

export const AGENT_BOT_RULES: BotRule[] = [
  {
    botName: "ChatGPT-User",
    category: "agent",
    patterns: [/chatgpt-user/i],
  },
  {
    botName: "Claude-Web",
    category: "agent",
    patterns: [/claude-web/i],
  },
  {
    botName: "OAI-SearchBot",
    category: "agent",
    patterns: [/oai-searchbot/i],
  },
  {
    botName: "Google-Extended",
    category: "llm",
    patterns: [/google-extended/i],
  },
  {
    botName: "Applebot-Extended",
    category: "llm",
    patterns: [/applebot-extended/i],
  },
  {
    botName: "GPTBot",
    category: "llm",
    patterns: [/\bgptbot\b/i],
  },
  {
    botName: "ClaudeBot",
    category: "llm",
    patterns: [/\bclaudebot\b/i],
  },
  {
    botName: "PerplexityBot",
    category: "llm",
    patterns: [/\bperplexitybot\b/i],
  },
  {
    botName: "CCBot",
    category: "llm",
    patterns: [/\bccbot\b/i],
  },
  {
    botName: "cohere-ai",
    category: "llm",
    patterns: [/cohere-ai/i],
  },
  {
    botName: "Bytespider",
    category: "llm",
    patterns: [/\bbytespider\b/i],
  },
  {
    botName: "anthropic-ai",
    category: "llm",
    patterns: [/anthropic-ai/i],
  },
  {
    botName: "Googlebot",
    category: "search",
    patterns: [/\bgooglebot\b/i],
  },
  {
    botName: "Bingbot",
    category: "search",
    patterns: [/\bbingbot\b/i],
  },
  {
    botName: "Applebot",
    category: "search",
    patterns: [/\bapplebot\b/i],
  },
  {
    botName: "DuckDuckBot",
    category: "search",
    patterns: [/\bduckduckbot\b/i],
  },
  {
    botName: "Baiduspider",
    category: "search",
    patterns: [/\bbaiduspider\b/i],
  },
  {
    botName: "YandexBot",
    category: "search",
    patterns: [/\byandexbot\b/i],
  },
];

const GENERIC_BOT_PATTERN = /(bot|crawl|crawler|spider)/i;

export function classifyAgentUserAgent(
  userAgent: string | null | undefined
): AgentDetection | null {
  if (!userAgent) {
    return null;
  }

  for (const rule of AGENT_BOT_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(userAgent))) {
      return {
        botName: rule.botName,
        category: rule.category,
      };
    }
  }

  if (GENERIC_BOT_PATTERN.test(userAgent)) {
    return {
      botName: "UnknownBot",
      category: "unknown",
    };
  }

  return null;
}

interface HeadersLike {
  get(name: string): string | null;
}

function normalizePublicPagePath(pagePath: string): string {
  const normalizedPath = pagePath.startsWith("/") ? pagePath : `/${pagePath}`;
  return normalizedPath.split("#")[0] || "/";
}

export function logAgentVisit(pagePath: string, requestHeaders: HeadersLike): void {
  const normalizedPath = normalizePublicPagePath(pagePath);

  if (normalizedPath.startsWith("/api") || normalizedPath.startsWith("/dashboard")) {
    return;
  }

  const userAgent = requestHeaders.get("user-agent");
  const detection = classifyAgentUserAgent(userAgent);

  if (!detection) {
    return;
  }

  const referrer =
    requestHeaders.get("referer") ?? requestHeaders.get("referrer") ?? null;

  after(async () => {
    try {
      const supabase = createAdminClient();
      const { error } = await supabase.from("agent_traffic_logs").insert({
        page_path: normalizedPath,
        user_agent: userAgent,
        bot_name: detection.botName,
        bot_category: detection.category,
        referrer,
      });

      if (error) {
        console.error("Failed to log agent traffic", {
          pagePath: normalizedPath,
          botName: detection.botName,
          error: error.message,
        });
      }
    } catch (error) {
      console.error("Failed to log agent traffic", {
        pagePath: normalizedPath,
        botName: detection.botName,
        error,
      });
    }
  });
}
