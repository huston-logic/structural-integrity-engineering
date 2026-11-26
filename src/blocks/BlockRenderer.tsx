import type { ComponentType } from "react";
import { blockComponents } from "./components";
import { EnterObserver } from "./EnterObserver";
import { registry } from "./definitions";
import { spacingFor } from "./rhythm";
import type { AnyBlockDefinition, BlockInstance } from "./schema";
import type { BlockProps } from "./types";

type AnyProps = BlockProps<Record<string, unknown>>;

const definitions = new Map<string, AnyBlockDefinition>(registry.map((def) => [def.type, def]));

type BlockViewProps = {
  block: BlockInstance;
  /** Where the block sits on its page: the first block never animates and is the page's H1. */
  index: number;
  /** The definition of the block just above this one, for spacing that joins the hero. */
  previous?: AnyBlockDefinition;
  /** True when this block holds the page's single H1. */
  primary: boolean;
};

/**
 * One block in its wrapper, which owns the spacing (rhythm.ts) and the entrance motion, so a block's component carries
 * neither. The page renderer and the /blocks showcase both build blocks with this. This site has no glows and its
 * wrapper is not positioned, so the blocks paint in the same order as before the pages were blocks (docs/SITE-DIFFERENCES.md, D4).
 */
export function BlockView({ block, index, previous, primary }: BlockViewProps) {
  const def = definitions.get(block.type);
  const Component = blockComponents[block.type] as ComponentType<AnyProps> | undefined;
  if (!def || !Component) throw new Error(`The block type "${block.type}" has no definition or component.`);
  const anchor = block.anchor ?? def.fixedAnchor;
  const headingId = `${anchor ?? `block-${index}`}-title`;
  const animated = index > 0 && def.motion.entrance !== "none";
  return (
    <div className={spacingFor(def, index, previous) || undefined} data-block={block.type} data-motion={animated ? "enter" : undefined}>
      <Component content={block.content} variant={block.variant ?? def.variants[0]?.name ?? "default"} anchor={anchor} headingId={headingId} primary={primary} />
    </div>
  );
}

/** Builds a page's blocks, in order. The content was checked at build time (lib/pages.ts). */
export function BlockRenderer({ blocks }: { blocks: readonly BlockInstance[] }) {
  return (
    <div className="relative overflow-x-clip">
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} index={index} previous={index > 0 ? definitions.get(blocks[index - 1]?.type ?? "") : undefined} primary={index === 0} />
      ))}
      <EnterObserver />
    </div>
  );
}
