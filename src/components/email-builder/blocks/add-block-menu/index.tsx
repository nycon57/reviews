'use client';

import React, { useCallback, useState } from 'react';
import {
  useDocument,
  setDocument,
  setSelectedBlockId,
  type TEditorDocument,
} from '../../editor/editor-context';
import { useCurrentBlockId } from '../../editor/editor-block';
import { DividerButton } from './divider-button';
import { PlaceholderButton } from './placeholder-button';
import { BlocksMenu } from './blocks-menu';
import { useEmailBranding } from '../../email-branding-context';
import type { EmailBrandingConfig } from '@/lib/organization/types';

interface AddBlockButtonProps {
  /** Show as a large placeholder instead of a thin divider */
  placeholder?: boolean;
  /** Index at which to insert the new block in the parent's childrenIds */
  insertAtIndex?: number;
}

export function generateId(): string {
  return (
    crypto.randomUUID?.() ??
    `block_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  );
}

const pad = (top: number, bottom: number, left: number, right: number) => ({
  padding: { top, bottom, left, right },
});
const DEFAULT_STYLE = { style: pad(16, 16, 24, 24) };

/**
 * Default data for each block type when adding a new block.
 * For Header/Footer, pre-populates from org branding if available.
 */
export function getDefaultBlockData(
  blockType: string,
  branding?: EmailBrandingConfig | null,
  orgLogoUrl?: string | null
): Record<string, unknown> {
  switch (blockType) {
    case 'Heading':
      return { props: { text: 'Heading' }, ...DEFAULT_STYLE };
    case 'Text':
      return { props: { text: 'Add your text here' }, ...DEFAULT_STYLE };
    case 'Button':
      return { props: { text: 'Button', url: '' }, ...DEFAULT_STYLE };
    case 'Image':
      return { props: { url: '', alt: 'Image' }, ...DEFAULT_STYLE };
    case 'Avatar':
      return { props: { imageUrl: '', size: 64, shape: 'circle' }, ...DEFAULT_STYLE };
    case 'Divider':
      return { props: { lineColor: '#CCCCCC', lineHeight: 1 }, ...DEFAULT_STYLE };
    case 'Spacer':
      return { props: { height: 16 } };
    case 'Html':
      return { props: { contents: '<p>Custom HTML</p>' }, ...DEFAULT_STYLE };
    case 'Container':
      return { props: { childrenIds: [] }, ...DEFAULT_STYLE };
    case 'ColumnsContainer':
      return {
        props: {
          columnsCount: 2,
          columnsGap: 16,
          contentAlignment: 'middle',
          columns: [{ childrenIds: [] }, { childrenIds: [] }],
        },
        ...DEFAULT_STYLE,
      };
    case 'Header': {
      const h = branding?.enabled ? branding.header : null;
      return {
        props: {
          variant: h?.variant || 'centered',
          logoSrc: h?.logoSrc || orgLogoUrl || '',
          logoAlt: h?.logoAlt || 'Your Company',
          logoHeight: h?.logoHeight || 42,
          navLinks: h?.navLinks?.length ? h.navLinks : [
            { label: 'Home', href: '#' },
            { label: 'About', href: '#' },
          ],
          socialLinks: h?.socialLinks ?? {},
          backgroundColor: h?.backgroundColor ?? undefined,
          linkColor: h?.linkColor || 'rgb(75,85,99)',
        },
        ...DEFAULT_STYLE,
      };
    }
    case 'Footer': {
      const f = branding?.enabled ? branding.footer : null;
      return {
        props: {
          variant: f?.variant || 'centered',
          logoSrc: f?.logoSrc || orgLogoUrl || '',
          logoAlt: f?.logoAlt || 'Logo',
          companyName: f?.companyName || 'Your Company',
          tagline: f?.tagline || 'Your tagline here',
          address: f?.address || '123 Main St, City, ST 12345',
          contactInfo: f?.contactInfo || 'hello@company.com',
          socialLinks: f?.socialLinks ?? {},
          backgroundColor: f?.backgroundColor ?? undefined,
        },
        ...DEFAULT_STYLE,
      };
    }
    default:
      return {};
  }
}

// ---------------------------------------------------------------------------
// Preset templates — composite blocks inserted as Container + atomic children
// ---------------------------------------------------------------------------

interface PresetResult {
  /** All blocks to add to the document (container + children) */
  blocks: Record<string, { type: string; data: Record<string, unknown> }>;
  /** The root block ID to insert into the parent's children list */
  rootId: string;
}

interface PresetChild {
  type: string;
  props: Record<string, unknown>;
  style?: Record<string, unknown>;
}

/** Creates a Container with atomic children blocks. */
function createCompositionPreset(children: PresetChild[]): PresetResult {
  const containerId = generateId();
  const childEntries = children.map((c) => {
    const id = generateId();
    return [id, { type: c.type, data: { props: c.props, ...(c.style && { style: c.style }) } }] as const;
  });

  return {
    rootId: containerId,
    blocks: {
      [containerId]: {
        type: 'Container',
        data: {
          props: { childrenIds: childEntries.map(([id]) => id) },
          style: { padding: { top: 0, bottom: 0, left: 0, right: 0 } },
        },
      },
      ...Object.fromEntries(childEntries),
    },
  };
}

function createPresetBlocks(blockType: string): PresetResult | null {
  switch (blockType) {
    case 'Article':
      return createCompositionPreset([
        { type: 'Image', props: { url: '', alt: 'Article image' }, style: pad(0, 0, 0, 0) },
        { type: 'Heading', props: { text: 'Article Title' }, style: pad(16, 8, 24, 24) },
        { type: 'Text', props: { text: 'Write your article content here...' }, style: pad(0, 16, 24, 24) },
        { type: 'Button', props: { text: 'Read more', url: '#' }, style: pad(0, 24, 24, 24) },
      ]);

    case 'Hero':
      return createCompositionPreset([
        { type: 'Image', props: { url: '', alt: 'Hero image' }, style: pad(0, 0, 0, 0) },
        { type: 'Heading', props: { text: 'Your Headline Here' }, style: pad(24, 8, 24, 24) },
        { type: 'Text', props: { text: 'Add a compelling description here...' }, style: pad(0, 16, 24, 24) },
        { type: 'Button', props: { text: 'Get Started', url: '#' }, style: pad(0, 24, 24, 24) },
      ]);

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Insert a child ID into a parent block's children list
// ---------------------------------------------------------------------------

function insertChildId(
  doc: TEditorDocument,
  parentId: string,
  childId: string,
  insertAtIndex?: number
): TEditorDocument | null {
  const parent = doc[parentId];
  if (!parent) return null;

  const data = parent.data as Record<string, unknown>;

  // Top-level childrenIds (EmailLayout)
  if (Array.isArray(data.childrenIds)) {
    const ids = [...(data.childrenIds as string[])];
    if (insertAtIndex != null) {
      ids.splice(insertAtIndex, 0, childId);
    } else {
      ids.push(childId);
    }
    return {
      ...doc,
      [parentId]: { ...parent, data: { ...data, childrenIds: ids } },
    };
  }

  // props.childrenIds (Container)
  const props = (data.props as Record<string, unknown>) ?? {};
  if (Array.isArray(props.childrenIds)) {
    const ids = [...((props.childrenIds as string[]) ?? [])];
    if (insertAtIndex != null) {
      ids.splice(insertAtIndex, 0, childId);
    } else {
      ids.push(childId);
    }
    return {
      ...doc,
      [parentId]: {
        ...parent,
        data: { ...data, props: { ...props, childrenIds: ids } },
      },
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Public API: insert a block (or preset) into the document
// ---------------------------------------------------------------------------

/**
 * Insert a new block into the document at the specified position.
 * For preset types (Article, Hero), inserts a Container with atomic children.
 * Returns the updated document and the root block ID, or null if parent not found.
 */
export function insertBlockIntoDocument(
  document: TEditorDocument,
  blockType: string,
  parentId: string,
  insertAtIndex?: number,
  branding?: EmailBrandingConfig | null,
  orgLogoUrl?: string | null
): { newDoc: TEditorDocument; newBlockId: string } | null {
  // Check for preset types first
  const preset = createPresetBlocks(blockType);
  if (preset) {
    const docWithBlocks = { ...document, ...preset.blocks };
    const newDoc = insertChildId(docWithBlocks, parentId, preset.rootId, insertAtIndex);
    return newDoc ? { newDoc, newBlockId: preset.rootId } : null;
  }

  // Single-block insertion
  const newBlockId = generateId();
  const docWithBlock = {
    ...document,
    [newBlockId]: {
      type: blockType,
      data: getDefaultBlockData(blockType, branding, orgLogoUrl),
    },
  };
  const newDoc = insertChildId(docWithBlock, parentId, newBlockId, insertAtIndex);
  return newDoc ? { newDoc, newBlockId } : null;
}

export function AddBlockButton({ placeholder = false, insertAtIndex }: AddBlockButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const document = useDocument();
  const parentBlockId = useCurrentBlockId();
  const { branding, orgLogoUrl } = useEmailBranding();

  const handleBlockSelect = useCallback(
    (blockType: string) => {
      const parentId = parentBlockId ?? 'root';
      const result = insertBlockIntoDocument(document, blockType, parentId, insertAtIndex, branding, orgLogoUrl);
      if (!result) return;
      setDocument(result.newDoc);
      setSelectedBlockId(result.newBlockId);
      setMenuOpen(false);
    },
    [document, parentBlockId, insertAtIndex, branding, orgLogoUrl]
  );

  if (placeholder) {
    return (
      <BlocksMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onBlockSelect={handleBlockSelect}
      >
        <div>
          <PlaceholderButton onClick={() => setMenuOpen(true)} />
        </div>
      </BlocksMenu>
    );
  }

  return (
    <BlocksMenu
      open={menuOpen}
      onClose={() => setMenuOpen(false)}
      onBlockSelect={handleBlockSelect}
    >
      <div>
        <DividerButton onClick={() => setMenuOpen(true)} />
      </div>
    </BlocksMenu>
  );
}
