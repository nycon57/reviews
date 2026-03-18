'use client';

import React from 'react';
import { z } from 'zod';
import { EmailLayoutPropsSchema } from './schemas/email-layout-props-schema';
import { getFontFamily } from './helpers/font-family';
import { EditorChildrenIds } from './editor-children-ids';
import { useEmailBranding } from '../email-branding-context';
import { useDocument } from '../editor/editor-context';
import { InheritedHeaderPreview, InheritedFooterPreview } from './inherited-block-preview';

type EmailLayoutEditorProps = z.infer<typeof EmailLayoutPropsSchema>;

function getBorder(props: EmailLayoutEditorProps) {
  if (!props.borderColor) return undefined;
  return `1px solid ${props.borderColor}`;
}

/** Check if the document contains a block with the given Waypoint type. */
function useHasBlockType(waypointType: string): boolean {
  const doc = useDocument();
  return Object.values(doc).some((block) => block.type === waypointType);
}

export function EmailLayoutEditor(props: EmailLayoutEditorProps) {
  const childrenIds = props.childrenIds ?? [];
  const { branding } = useEmailBranding();
  const hasUserHeader = useHasBlockType('Header');
  const hasUserFooter = useHasBlockType('Footer');

  const showInheritedHeader = branding?.enabled && !hasUserHeader;
  const showInheritedFooter = branding?.enabled && !hasUserFooter;

  return (
    <div
      style={{
        backgroundColor: props.backdropColor ?? '#F5F5F5',
        color: props.textColor ?? '#262626',
        fontFamily: getFontFamily(props.fontFamily),
        fontSize: '16px',
        fontWeight: '400',
        letterSpacing: '0.15008px',
        lineHeight: '1.5',
        margin: '0',
        padding: '32px 0',
        minHeight: '100%',
        width: '100%',
      }}
    >
      <table
        align="center"
        width="100%"
        style={{
          margin: '0 auto',
          maxWidth: '600px',
          backgroundColor: props.canvasColor ?? '#FFFFFF',
          borderRadius: props.borderRadius ?? undefined,
          border: getBorder(props),
        }}
        role="presentation"
        cellSpacing={0}
        cellPadding={0}
        border={0}
      >
        <tbody>
          <tr style={{ width: '100%' }}>
            <td>
              {/* Inherited org header (grayed out) */}
              {showInheritedHeader && branding && (
                <InheritedHeaderPreview branding={branding} />
              )}

              <EditorChildrenIds childrenIds={childrenIds} />

              {/* Inherited org footer (grayed out) */}
              {showInheritedFooter && branding && (
                <InheritedFooterPreview branding={branding} />
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* CAN-SPAM compliance strip preview */}
      <table
        align="center"
        width="100%"
        style={{
          margin: '0 auto',
          maxWidth: '600px',
          backgroundColor: '#f9fafb',
          borderTop: '1px solid #e5e7eb',
        }}
        role="presentation"
        cellSpacing={0}
        cellPadding={0}
        border={0}
      >
        <tbody>
          <tr>
            <td style={{ padding: '12px 24px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '10px', color: '#9ca3af', lineHeight: '14px' }}>
                CAN-SPAM compliance (auto-included in sent emails)
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#6b7280', lineHeight: '16px' }}>
                Unsubscribe &middot; 123 Main Street, Suite 100 &middot; &copy; {new Date().getFullYear()} Company
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
