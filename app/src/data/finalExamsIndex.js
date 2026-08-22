import presets from './finalExams.json';
import { FINAL_EXAM_TEST_ID } from './constants';

export const finalExamPresets = presets;

function shuffle(array) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pickFinalExam() {
  const preset = finalExamPresets[Math.floor(Math.random() * finalExamPresets.length)];
  return {
    id: FINAL_EXAM_TEST_ID,
    title: 'Final Exam',
    presetId: preset.id,
    questions: shuffle(preset.questions),
  };
}
