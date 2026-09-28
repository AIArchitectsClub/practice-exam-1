import test1 from './test1.json';
import test2 from './test2.json';
import test3 from './test3.json';
import test4 from './test4.json';
import test5 from './test5.json';
import test6 from './test6.json';
import test7 from './test7.json';
import sectionAgenticOrchestration from './sectionAgenticOrchestration.json';
import sectionToolMcp from './sectionToolMcp.json';
import sectionClaudeCodeWorkflows from './sectionClaudeCodeWorkflows.json';
import sectionPromptOutput from './sectionPromptOutput.json';
import sectionContextReliability from './sectionContextReliability.json';

export const tests = [
  { id: 1, title: 'Practice Test 1', questions: test1, kind: 'sequential' },
  { id: 2, title: 'Practice Test 2', questions: test2, kind: 'sequential' },
  { id: 3, title: 'Practice Test 3', questions: test3, kind: 'sequential' },
  { id: 4, title: 'Practice Test 4', questions: test4, kind: 'sequential' },
  { id: 5, title: 'Practice Test 5', questions: test5, kind: 'sequential' },
  { id: 6, title: 'Practice Test 6', questions: test6, kind: 'sequential' },
  { id: 7, title: 'Practice Test 7', questions: test7, kind: 'sequential' },
  {
    id: 8,
    title: 'Agentic Architecture & Orchestration',
    questions: sectionAgenticOrchestration,
    kind: 'section',
  },
  {
    id: 9,
    title: 'Tool Design & MCP Integration',
    questions: sectionToolMcp,
    kind: 'section',
  },
  {
    id: 10,
    title: 'Claude Code Configuration & Workflows',
    questions: sectionClaudeCodeWorkflows,
    kind: 'section',
  },
  {
    id: 11,
    title: 'Prompt Engineering & Structured Output',
    questions: sectionPromptOutput,
    kind: 'section',
  },
  {
    id: 12,
    title: 'Context Management & Reliability',
    questions: sectionContextReliability,
    kind: 'section',
  },
];
