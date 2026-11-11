import { montarMotion } from '../motion.js';
import { motion } from '../logic/motion-requisito.js';

export function mount(el, ctx) {
  return montarMotion(el, ctx, motion);
}
