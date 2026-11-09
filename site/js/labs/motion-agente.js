import { montarMotion } from '../motion.js';
import { motion } from '../logic/motion-agente.js';

export function mount(el, ctx) {
  return montarMotion(el, ctx, motion);
}
