import { montarMotion } from '../motion.js';
import { motion } from '../logic/motion-worktrees.js';

export function mount(el, ctx) {
  return montarMotion(el, ctx, motion);
}
