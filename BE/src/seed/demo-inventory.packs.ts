import { DemoInventoryPack } from './demo-inventory.types';
import { SOLO_DEMO_PACK } from './demo-inventory.data';
import { CHAIN_DEMO_PACK } from './demo-chain-inventory.data';
import { STORE_DEMO_PACK } from './demo-store-inventory.data';

const DEMO_SLUGS = new Set(['demo-solo', 'demo-store', 'demo-chain']);

export function isKnownDemoSlug(slug?: string): boolean {
  return !!slug && DEMO_SLUGS.has(slug);
}

/** Solo / Chain / Store — catalog theo segment */
export function getDemoInventoryPack(slug?: string): DemoInventoryPack {
  if (slug === 'demo-store') return STORE_DEMO_PACK;
  if (slug === 'demo-chain') return CHAIN_DEMO_PACK;
  return SOLO_DEMO_PACK;
}
