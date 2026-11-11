import { montarMotion } from '../motion.js';
import { motion } from '../logic/motion-subagent.js';

export function mount(el, ctx) {
  return montarMotion(el, ctx, motion);
}
