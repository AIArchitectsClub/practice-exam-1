export const TOPICS = {
  orchestration: {
    label: 'Multi-Agent Orchestration',
    tips: [
      'Practice tracing how a coordinator should pass outputs between subagents explicitly via prompts rather than assuming shared memory.',
      'Review patterns for delegation, tool-gated subagent invocation, and re-invoking agents when gaps are found.',
      'Study how to resume a crashed multi-agent pipeline without losing prior findings or repeating work.',
    ],
  },
  context: {
    label: 'Context & State Management',
    tips: [
      'Review how conversation history, session summaries, and tool results should be carried (or trimmed) across turns.',
      'Practice deciding when to resume full history vs. re-summarize vs. start fresh with injected context.',
      'Study the tradeoffs of context window limits and stale tool results in long-running sessions.',
    ],
  },
  prompting: {
    label: 'Prompt Engineering & System Prompts',
    tips: [
      'Practice rewriting brittle, over-conditional system prompts into flexible general heuristics.',
      'Review few-shot example design and when examples help vs. hurt other tasks in the same prompt.',
      'Study how to separate concerns across prompts rather than overloading one prompt with multiple objectives.',
    ],
  },
  tools: {
    label: 'Tool Design & Function Calling',
    tips: [
      'Review when to split a generic tool into purpose-specific tools with well-defined schemas.',
      'Practice writing tool descriptions and parameters that reduce ambiguity for the model.',
      'Study tool permissioning — what happens when a required tool is unavailable to an agent.',
    ],
  },
  evaluation: {
    label: 'Evaluation & Feedback Loops',
    tips: [
      'Review how to design eval suites that catch recall/precision tradeoffs across categories.',
      'Practice interpreting eval results to decide between prompt changes, checklists, or model upgrades.',
      'Study reflection/self-critique loop patterns for improving agent output quality.',
    ],
  },
  retrieval: {
    label: 'Retrieval, Search & Document Analysis',
    tips: [
      'Review how to reconcile data from multiple sources (e.g. differing dates or freshness).',
      'Practice designing structured outputs (timestamps, metadata) that downstream synthesis steps rely on.',
      'Study when to add a research-planning step before search vs. reactively searching for gaps.',
    ],
  },
  safety: {
    label: 'Safety, Guardrails & Reliability',
    tips: [
      'Review escalation and human-in-the-loop patterns for high-stakes or ambiguous requests.',
      'Practice identifying silent-failure modes (no error, but wrong or missing behavior).',
      'Study how to design safeguards that don’t over-trigger on legitimate requests.',
    ],
  },
  cost_perf: {
    label: 'Cost, Latency & Model Selection',
    tips: [
      'Review tradeoffs between model tier, token limits, and latency for different task types.',
      'Practice reasoning about when upgrading the model is the right fix vs. a prompt/architecture fix.',
      'Study strategies for controlling cost in multi-agent or multi-call pipelines.',
    ],
  },
  agentic_flow: {
    label: 'Agentic Planning, Loops & Error Recovery',
    tips: [
      'Review how agents should plan, retry, and recover from partial failures mid-task.',
      'Practice distinguishing rigid linear pipelines from adaptive, loop-based architectures.',
      'Study how an agent should detect and report that it doesn’t have enough information to proceed.',
    ],
  },
  conversational: {
    label: 'Conversational & Customer-Facing Agents',
    tips: [
      'Review techniques for picking up implicit user cues (expertise level, tone) instead of relying on rigid rules.',
      'Practice designing session hand-offs (e.g. a customer returning hours later) without stale or repeated actions.',
      'Study how to keep multi-turn conversational agents consistent and context-aware over long sessions.',
    ],
  },
};

export const TOPIC_ORDER = Object.keys(TOPICS);
