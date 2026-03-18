'use client';

import React, { createContext, useCallback, useContext } from 'react';
import { z } from 'zod';
import {
  buildBlockComponent,
  buildBlockConfigurationDictionary,
  buildBlockConfigurationSchema,
} from '@usewaypoint/document-core';

// Block components — only Html still uses Waypoint
import { Html, HtmlPropsSchema } from '@usewaypoint/block-html';

// Editor-specific container/layout components
import { ColumnsContainerPropsSchema } from '../blocks/schemas/columns-container-props-schema';
import { ContainerPropsSchema } from '../blocks/schemas/container-props-schema';
import { EmailLayoutPropsSchema } from '../blocks/schemas/email-layout-props-schema';

// Custom block schemas (replacing Waypoint blocks)
import { TextPropsSchema } from '../blocks/schemas/text-props-schema';
import { HeadingPropsSchema as HeadingEditorSchema } from '../blocks/schemas/heading-props-schema';
import { ButtonPropsSchema as ButtonEditorSchema } from '../blocks/schemas/button-props-schema';
import { ImagePropsSchema as ImageEditorSchema } from '../blocks/schemas/image-props-schema';
import { DividerPropsSchema as DividerEditorSchema } from '../blocks/schemas/divider-props-schema';
import { SpacerPropsSchema as SpacerEditorSchema } from '../blocks/schemas/spacer-props-schema';
import { AvatarPropsSchema } from '../blocks/schemas/avatar-props-schema';

// Custom block schemas
import { HeaderPropsSchema } from '../blocks/schemas/header-props-schema';
import { FooterPropsSchema } from '../blocks/schemas/footer-props-schema';
import { TestimonialPropsSchema } from '../blocks/schemas/testimonial-props-schema';
import { StatsPropsSchema } from '../blocks/schemas/stats-props-schema';
import { FeatureListPropsSchema } from '../blocks/schemas/feature-list-props-schema';
import { RatingPropsSchema } from '../blocks/schemas/rating-props-schema';
import { CalloutPropsSchema } from '../blocks/schemas/callout-props-schema';
import { ListPropsSchema } from '../blocks/schemas/list-props-schema';
import { ButtonGroupPropsSchema } from '../blocks/schemas/button-group-props-schema';
import { HeroPropsSchema } from '../blocks/schemas/hero-props-schema';
import { GalleryPropsSchema } from '../blocks/schemas/gallery-props-schema';
import { ArticlePropsSchema } from '../blocks/schemas/article-props-schema';
import { ColumnsContainerEditor } from '../blocks/columns-container-editor';
import { ContainerEditor } from '../blocks/container-editor';
import { EmailLayoutEditor } from '../blocks/email-layout-editor';
import { EditorBlockWrapper } from '../blocks/editor-block-wrapper';

import { useEditorDocumentStore, useSelectedMainTab, type TEditorDocument } from './editor-context';

// ---------------------------------------------------------------------------
// Preview mode merge-field sample values
// ---------------------------------------------------------------------------

const SAMPLE_MERGE_VALUES: Record<string, string> = {
  customer_name: 'Sarah Mitchell',
  customer_first_name: 'Sarah',
  customer_email: 'sarah@example.com',
  professional_name: 'Alex Johnson',
  professional_first_name: 'Alex',
  professional_photo_url: 'https://placehold.co/120x120/e8f0ec/354f52?text=AJ',
  company_name: 'Your Company',
  company_logo_url: '',
  survey_link: '#',
  review_link: '#',
  unsubscribe_link: '#',
};

/** Replace {{field}} placeholders with sample values */
function previewText(text: string | undefined | null, isPreview: boolean): string {
  if (!text) return '';
  if (!isPreview) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => SAMPLE_MERGE_VALUES[key] ?? match);
}

/** Hook: returns true when the main tab is 'preview' */
function useIsPreview() {
  return useSelectedMainTab() === 'preview';
}

// ---------------------------------------------------------------------------
// Editor dictionary — inline wrappers so TS infers arrow fn return types
// ---------------------------------------------------------------------------

const EDITOR_DICTIONARY = buildBlockConfigurationDictionary({
  Avatar: {
    schema: AvatarPropsSchema,
    Component: (data) => {
      const preview = useIsPreview();
      const variant = data.props?.variant ?? 'single';
      const images = (data.props?.images as { src: string; alt: string }[] | null) ?? [];
      const size = data.props?.size ?? 44;
      const shape = data.props?.shape ?? 'circle';
      const radius = shape === 'circle' ? '50%' : '8px';

      if (variant === 'stacked' && images.length > 1) {
        return (
          <EditorBlockWrapper>
            <div style={{ padding: '8px 24px', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex' }}>
                {images.slice(0, 5).map((img, i) => (
                  <div key={i} style={{ marginLeft: i > 0 ? -(size / 4) : 0 }}>
                    {img.src ? (
                      <img src={img.src} alt={img.alt || 'Avatar'} style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', border: '2px solid #fff', display: 'block' }} />
                    ) : (
                      <div style={{ width: size, height: size, borderRadius: radius, backgroundColor: '#e5e7eb', border: '2px solid #fff' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </EditorBlockWrapper>
        );
      }

      if (variant === 'profile') {
        const img = images[0];
        return (
          <EditorBlockWrapper>
            <div style={{ padding: '8px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
              {img?.src ? (
                <img src={img.src} alt={img.alt || 'Avatar'} style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: size, height: size, borderRadius: radius, backgroundColor: '#e5e7eb', flexShrink: 0 }} />
              )}
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{previewText(data.props?.name, preview) || 'Name'}</div>
                {data.props?.title && <div style={{ fontSize: 12, color: '#6b7280' }}>{previewText(data.props.title, preview)}</div>}
              </div>
            </div>
          </EditorBlockWrapper>
        );
      }

      // Single (default)
      const img = images[0];
      return (
        <EditorBlockWrapper>
          <div style={{ padding: '8px 24px', textAlign: 'center' }}>
            {img?.src ? (
              <img src={img.src} alt={img.alt || 'Avatar'} style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', display: 'inline-block' }} />
            ) : (
              <div style={{ width: size, height: size, borderRadius: radius, backgroundColor: '#e5e7eb', display: 'inline-block' }} />
            )}
          </div>
        </EditorBlockWrapper>
      );
    },
  },
  Button: {
    schema: ButtonEditorSchema,
    Component: (data) => {
      const preview = useIsPreview();
      const bgColor = data.props?.backgroundColor ?? 'rgb(79,70,229)';
      const txtColor = data.props?.textColor ?? '#ffffff';
      const radius = data.props?.borderRadius ?? 4;
      const pad = data.props?.padding ?? 12;
      const border = data.props?.borderColor ? `1px solid ${data.props.borderColor}` : 'none';
      const align = data.props?.align ?? 'center';
      return (
        <EditorBlockWrapper>
          <div style={{ padding: '8px 24px', textAlign: align as 'left' | 'center' | 'right' }}>
            <div
              style={{
                display: data.props?.fullWidth ? 'block' : 'inline-block',
                padding: `${pad}px ${pad * 2}px`,
                backgroundColor: bgColor,
                color: txtColor,
                borderRadius: radius,
                border,
                fontSize: 14,
                fontWeight: data.props?.fontWeight ?? 600,
                textAlign: 'center',
                cursor: 'default',
              }}
            >
              {previewText(data.props?.text, preview) || 'Click Here'}
            </div>
          </div>
        </EditorBlockWrapper>
      );
    },
  },
  Container: {
    schema: ContainerPropsSchema,
    Component: (props) => (
      <EditorBlockWrapper>
        <ContainerEditor {...props} />
      </EditorBlockWrapper>
    ),
  },
  ColumnsContainer: {
    schema: ColumnsContainerPropsSchema,
    Component: (props) => (
      <EditorBlockWrapper>
        <ColumnsContainerEditor {...props} />
      </EditorBlockWrapper>
    ),
  },
  Heading: {
    schema: HeadingEditorSchema,
    Component: (data) => {
      const preview = useIsPreview();
      const level = data.props?.level ?? 'h2';
      const levelSizes: Record<string, number> = { h1: 36, h2: 30, h3: 24, h4: 20, h5: 18, h6: 16 };
      const fontSize = data.props?.fontSize ?? levelSizes[level as string] ?? 30;
      return (
        <EditorBlockWrapper>
          <div style={{ padding: '8px 24px' }}>
            <div
              style={{
                fontSize,
                fontWeight: data.props?.fontWeight ?? 600,
                color: data.props?.color ?? 'rgb(17,24,39)',
                textAlign: (data.props?.align as 'left' | 'center' | 'right') ?? 'left',
                lineHeight: 1.2,
              }}
            >
              {previewText(data.props?.text, preview) || 'Your Heading'}
            </div>
          </div>
        </EditorBlockWrapper>
      );
    },
  },
  Html: {
    schema: HtmlPropsSchema,
    Component: (props) => (
      <EditorBlockWrapper>
        <Html {...props} />
      </EditorBlockWrapper>
    ),
  },
  Image: {
    schema: ImageEditorSchema,
    Component: (data) => {
      const src = data.props?.src || 'https://placehold.co/600x400@2x/F8F8F8/CCC?text=Your%20image';
      const align = (data.props?.align as 'left' | 'center' | 'right') ?? 'center';
      return (
        <EditorBlockWrapper>
          <div style={{ padding: '8px 24px', textAlign: align }}>
            <img
              src={src}
              alt={data.props?.alt ?? ''}
              style={{
                maxWidth: data.props?.width ?? 600,
                width: '100%',
                height: data.props?.height ?? 'auto',
                borderRadius: data.props?.borderRadius ?? 0,
                display: 'inline-block',
              }}
            />
            {data.props?.caption && (
              <div style={{ fontSize: 12, color: '#84a98c', marginTop: 4, textAlign: align }}>
                {data.props.caption}
              </div>
            )}
          </div>
        </EditorBlockWrapper>
      );
    },
  },
  Text: {
    schema: TextPropsSchema,
    Component: (data) => {
      const preview = useIsPreview();
      return (
        <EditorBlockWrapper>
          <div
            style={{
              padding: '8px 24px',
              fontSize: data.props?.fontSize ?? 16,
              lineHeight: data.props?.lineHeight ?? '24px',
              color: data.props?.color ?? 'rgb(17,24,39)',
              fontWeight: data.props?.fontWeight === '600' ? 600 : 400,
              textAlign: (data.props?.align as 'left' | 'center' | 'right') ?? 'left',
              whiteSpace: 'pre-wrap',
            }}
          >
            {previewText(data.props?.text, preview) || 'Enter your text here...'}
          </div>
        </EditorBlockWrapper>
      );
    },
  },
  EmailLayout: {
    schema: EmailLayoutPropsSchema,
    Component: (p) => <EmailLayoutEditor {...p} />,
  },
  Spacer: {
    schema: SpacerEditorSchema,
    Component: (data) => {
      const preview = useIsPreview();
      const h = data.props?.height ?? 24;
      return (
        <EditorBlockWrapper>
          <div style={{ height: h, backgroundColor: 'transparent', position: 'relative' }}>
            {!preview && (
              <>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px dashed #d1d5db', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 10, color: '#9ca3af', backgroundColor: '#fff', padding: '0 4px' }}>
                  {h}px
                </div>
              </>
            )}
          </div>
        </EditorBlockWrapper>
      );
    },
  },
  Divider: {
    schema: DividerEditorSchema,
    Component: (data) => {
      const variant = data.props?.variant ?? 'solid';
      const color = data.props?.color ?? 'rgb(209,213,219)';
      const thickness = data.props?.thickness ?? 1;
      const spacingMap: Record<string, number> = { sm: 8, md: 16, lg: 24 };
      const margin = spacingMap[(data.props?.spacing as string) ?? 'md'] ?? 16;

      if (data.props?.label) {
        return (
          <EditorBlockWrapper>
            <div style={{ padding: `${margin}px 24px`, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, borderTop: `${thickness}px ${variant} ${color}` }} />
              <span style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>{data.props.label}</span>
              <div style={{ flex: 1, borderTop: `${thickness}px ${variant} ${color}` }} />
            </div>
          </EditorBlockWrapper>
        );
      }

      return (
        <EditorBlockWrapper>
          <div style={{ padding: `${margin}px 24px` }}>
            <hr style={{
              border: 'none',
              borderTop: variant === 'gradient'
                ? `${thickness}px solid transparent`
                : `${thickness}px ${variant} ${color}`,
              backgroundImage: variant === 'gradient' ? `linear-gradient(to right, transparent, ${color}, transparent)` : undefined,
              margin: 0,
            }} />
          </div>
        </EditorBlockWrapper>
      );
    },
  },
  Header: {
    schema: HeaderPropsSchema,
    Component: (data) => {
      const preview = useIsPreview();
      const variant = data.props?.variant ?? 'centered';
      const bgColor = data.props?.backgroundColor ?? '#ffffff';
      const linkColor = data.props?.linkColor ?? 'rgb(75,85,99)';
      const navLinks = (data.props?.navLinks as { label: string; href: string }[] | null) ?? [];
      const socialLinks = (data.props?.socialLinks as Record<string, string | null | undefined> | null) ?? {};

      const logoAlt = previewText(data.props?.logoAlt, preview) || 'Logo';
      const logo = data.props?.logoSrc ? (
        <img
          src={data.props.logoSrc}
          alt={logoAlt}
          style={{ height: data.props?.logoHeight ?? 42, width: 'auto' }}
        />
      ) : (
        <span style={{ fontSize: 20, fontWeight: 700, color: '#354f52', letterSpacing: '-0.02em' }}>
          {logoAlt || 'Your Logo'}
        </span>
      );

      const linkStyle = { color: linkColor, textDecoration: 'none' as const, fontSize: 13, padding: '0 8px' };

      // Centered: logo centered, nav below
      if (variant === 'centered') {
        return (
          <EditorBlockWrapper>
            <div style={{ backgroundColor: bgColor, padding: '32px 24px', textAlign: 'center' }}>
              <div>{logo}</div>
              {navLinks.length > 0 && (
                <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 4 }}>
                  {navLinks.map((l, i) => (
                    <span key={i} style={linkStyle}>{l.label}</span>
                  ))}
                </div>
              )}
            </div>
          </EditorBlockWrapper>
        );
      }

      // Social: logo left, social labels right
      if (variant === 'social') {
        const socials = Object.entries(socialLinks).filter(([, url]) => url);
        const socialLabelMap: Record<string, string> = { twitter: 'X', instagram: 'IG', facebook: 'FB', linkedin: 'in' };
        return (
          <EditorBlockWrapper>
            <div style={{ backgroundColor: bgColor, padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>{logo}</div>
              <div style={{ display: 'flex', gap: 12 }}>
                {socials.map(([key]) => (
                  <span key={key} style={{ ...linkStyle, fontSize: 12, fontWeight: 500 }}>
                    {socialLabelMap[key] ?? key}
                  </span>
                ))}
                {socials.length === 0 && (
                  <span style={{ fontSize: 12, color: '#aaa' }}>Add social links</span>
                )}
              </div>
            </div>
          </EditorBlockWrapper>
        );
      }

      // Inline: logo left, nav right
      return (
        <EditorBlockWrapper>
          <div style={{ backgroundColor: bgColor, padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>{logo}</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {navLinks.length > 0
                ? navLinks.map((l, i) => (
                    <span key={i} style={linkStyle}>{l.label}</span>
                  ))
                : <span style={{ fontSize: 12, color: '#aaa' }}>Add nav links</span>
              }
            </div>
          </div>
        </EditorBlockWrapper>
      );
    },
  },
  Footer: {
    schema: FooterPropsSchema,
    Component: (data) => {
      const preview = useIsPreview();
      const variant = data.props?.variant ?? 'centered';
      const bgColor = data.props?.backgroundColor ?? '#f9fafb';
      const socialLinks = (data.props?.socialLinks as Record<string, string | null | undefined> | null) ?? {};
      const socials = Object.entries(socialLinks).filter(([, url]) => url);
      const socialLabelMap: Record<string, string> = { facebook: 'FB', twitter: 'X', instagram: 'IG', linkedin: 'in' };

      const logo = data.props?.logoSrc ? (
        <img
          src={data.props.logoSrc}
          alt={data.props?.logoAlt ?? 'Logo'}
          style={{ height: 36, width: 'auto' }}
        />
      ) : null;

      // Centered variant
      if (variant === 'centered') {
        return (
          <EditorBlockWrapper>
            <div style={{ backgroundColor: bgColor, padding: '32px 24px', textAlign: 'center' }}>
              {logo && <div style={{ marginBottom: 12 }}>{logo}</div>}
              {data.props?.companyName && (
                <div style={{ fontSize: 16, fontWeight: 600, color: 'rgb(17,24,39)', marginBottom: 4 }}>
                  {previewText(data.props.companyName, preview)}
                </div>
              )}
              {data.props?.tagline && (
                <div style={{ fontSize: 14, color: 'rgb(107,114,128)', marginBottom: 12 }}>
                  {previewText(data.props.tagline, preview)}
                </div>
              )}
              {socials.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
                  {socials.map(([key]) => (
                    <span key={key} style={{ display: 'inline-block', width: 36, height: 36, borderRadius: '50%', backgroundColor: '#e5e7eb', lineHeight: '36px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#6b7280' }}>
                      {socialLabelMap[key] ?? key}
                    </span>
                  ))}
                </div>
              )}
              {data.props?.address && (
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgb(107,114,128)', marginBottom: 4 }}>
                  {data.props.address}
                </div>
              )}
              {data.props?.contactInfo && (
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgb(107,114,128)' }}>
                  {data.props.contactInfo}
                </div>
              )}
            </div>
          </EditorBlockWrapper>
        );
      }

      // Split variant
      return (
        <EditorBlockWrapper>
          <div style={{ backgroundColor: bgColor, padding: '32px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                {logo && <div style={{ marginBottom: 8 }}>{logo}</div>}
                {data.props?.companyName && (
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'rgb(17,24,39)', marginBottom: 4 }}>
                    {previewText(data.props.companyName, preview)}
                  </div>
                )}
                {data.props?.tagline && (
                  <div style={{ fontSize: 14, color: 'rgb(107,114,128)' }}>
                    {previewText(data.props.tagline, preview)}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                {socials.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 8 }}>
                    {socials.map(([key]) => (
                      <span key={key} style={{ display: 'inline-block', width: 36, height: 36, borderRadius: '50%', backgroundColor: '#e5e7eb', lineHeight: '36px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#6b7280' }}>
                        {socialLabelMap[key] ?? key}
                      </span>
                    ))}
                  </div>
                )}
                {data.props?.address && (
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'rgb(107,114,128)', marginBottom: 4 }}>
                    {data.props.address}
                  </div>
                )}
                {data.props?.contactInfo && (
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'rgb(107,114,128)' }}>
                    {data.props.contactInfo}
                  </div>
                )}
              </div>
            </div>
          </div>
        </EditorBlockWrapper>
      );
    },
  },
  Testimonial: {
    schema: TestimonialPropsSchema,
    Component: (data) => {
      const preview = useIsPreview();
      const variant = data.props?.variant ?? 'default';
      const rating = data.props?.rating ?? 0;
      return (
        <EditorBlockWrapper>
          <div
            style={{
              padding: variant === 'compact' ? '16px' : '24px',
              backgroundColor: variant === 'featured' ? '#f8faf8' : '#ffffff',
              borderLeft: variant === 'featured' ? '4px solid #52796f' : 'none',
              textAlign: variant === 'compact' ? 'left' : 'center',
            }}
          >
            {rating > 0 && (
              <div style={{ marginBottom: 8, fontSize: 16 }}>
                {'★'.repeat(rating)}
                {'☆'.repeat(5 - rating)}
              </div>
            )}
            <div
              style={{
                fontSize: variant === 'compact' ? 14 : 16,
                fontStyle: 'italic',
                color: '#333',
                marginBottom: 12,
                lineHeight: 1.5,
              }}
            >
              &ldquo;{previewText(data.props?.quote, preview) || 'Your testimonial quote here'}&rdquo;
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>
              {previewText(data.props?.authorName, preview) || 'Author Name'}
            </div>
            {data.props?.authorTitle && (
              <div style={{ fontSize: 12, color: '#888' }}>
                {previewText(data.props.authorTitle, preview)}
              </div>
            )}
          </div>
        </EditorBlockWrapper>
      );
    },
  },
  Stats: {
    schema: StatsPropsSchema,
    Component: (data) => {
      const items = data.props?.items ?? [];
      const columns = data.props?.columns ?? 3;
      const showDividers = data.props?.showDividers ?? false;
      const variant = data.props?.variant ?? 'row';
      const displayItems = items.length > 0
        ? items
        : [
            { value: '100+', label: 'Customers' },
            { value: '4.9', label: 'Rating' },
            { value: '99%', label: 'Uptime' },
          ];

      if (variant === 'cards') {
        return (
          <EditorBlockWrapper>
            <div style={{ padding: '16px', display: 'flex', gap: 8 }}>
              {displayItems.slice(0, columns).map((item, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    minHeight: 112,
                    borderRadius: 16,
                    backgroundColor: '#f3f4f6',
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      letterSpacing: '-0.025em',
                      color: '#111827',
                    }}
                  >
                    {item.value}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </EditorBlockWrapper>
        );
      }

      return (
        <EditorBlockWrapper>
          <div
            style={{
              backgroundColor: data.props?.cardBackgroundColor ?? '#f8f8f8',
              padding: '24px',
              display: 'flex',
              justifyContent: 'center',
              gap: 0,
            }}
          >
            {displayItems
              .slice(0, columns)
              .map((item, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    borderRight:
                      showDividers && i < columns - 1
                        ? '1px solid #ddd'
                        : 'none',
                    padding: '0 16px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: '#2f3e46',
                    }}
                  >
                    {item.value}
                  </div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                    {item.label}
                  </div>
                </div>
              ))}
          </div>
        </EditorBlockWrapper>
      );
    },
  },
  FeatureList: {
    schema: FeatureListPropsSchema,
    Component: (data) => {
      const items = data.props?.items ?? [];
      const variant = data.props?.variant ?? 'bulleted';
      const columns = data.props?.columns ?? 1;
      const displayItems =
        items.length > 0
          ? items
          : [
              { title: 'Feature One', description: 'Description of feature one' },
              { title: 'Feature Two', description: 'Description of feature two' },
            ];

      // Variant: icon-rows
      if (variant === 'icon-rows') {
        return (
          <EditorBlockWrapper>
            <div style={{ padding: '16px 24px' }}>
              {displayItems.map((item, i) => (
                <React.Fragment key={i}>
                  <div style={{ borderTop: '1px solid #e5e7eb', padding: '12px 0', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: '#f3f4f6', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.iconUrl ? (
                        <img src={item.iconUrl} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} />
                      ) : (
                        <span style={{ fontSize: 20, color: '#9ca3af' }}>{'\u25CF'}</span>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 600, color: 'rgb(17,24,39)' }}>{item.title}</div>
                      <div style={{ fontSize: 16, color: 'rgb(107,114,128)', marginTop: 2 }}>{item.description}</div>
                    </div>
                  </div>
                </React.Fragment>
              ))}
              <div style={{ borderTop: '1px solid #e5e7eb' }} />
            </div>
          </EditorBlockWrapper>
        );
      }

      // Variant: numbered-circles
      if (variant === 'numbered-circles') {
        return (
          <EditorBlockWrapper>
            <div style={{ padding: '16px 24px' }}>
              {displayItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 18, marginBottom: 36, paddingLeft: 12, paddingRight: 32, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      backgroundColor: 'rgb(79,70,229)',
                      borderRadius: '50%',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'rgb(17,24,39)' }}>{item.title}</div>
                    <div style={{ fontSize: 14, color: 'rgb(107,114,128)', marginTop: 2 }}>{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </EditorBlockWrapper>
        );
      }

      // Default: numbered / bulleted
      return (
        <EditorBlockWrapper>
          <div
            style={{
              padding: '16px 24px',
              display: 'grid',
              gridTemplateColumns: columns === 2 ? '1fr 1fr' : '1fr',
              gap: '12px',
            }}
          >
            {displayItems.map((item, i) => (
              <div key={i} style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
                  {variant === 'numbered' ? `${i + 1}. ` : '\u2022 '}
                  {item.title}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: '#666',
                    marginTop: 2,
                    paddingLeft: variant === 'numbered' ? 16 : 14,
                  }}
                >
                  {item.description}
                </div>
              </div>
            ))}
          </div>
        </EditorBlockWrapper>
      );
    },
  },
  Rating: {
    schema: RatingPropsSchema,
    Component: (data) => {
      const preview = useIsPreview();
      const scale = data.props?.scale ?? 10;
      return (
        <EditorBlockWrapper>
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: '#333',
                marginBottom: 16,
              }}
            >
              {previewText(data.props?.question, preview) || 'How would you rate your experience?'}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 4,
                marginBottom: 8,
              }}
            >
              {Array.from({ length: scale }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: scale === 10 ? 32 : 40,
                    height: 32,
                    borderRadius: 4,
                    backgroundColor: '#52796f',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                color: '#888',
                maxWidth: scale === 10 ? 360 : 220,
                margin: '0 auto',
              }}
            >
              <span>{data.props?.lowLabel || 'Not likely'}</span>
              <span>{data.props?.highLabel || 'Very likely'}</span>
            </div>
          </div>
        </EditorBlockWrapper>
      );
    },
  },
  Callout: {
    schema: CalloutPropsSchema,
    Component: (data) => {
      const preview = useIsPreview();
      const variant = data.props?.variant ?? 'info';
      const variantStyles: Record<
        string,
        { bg: string; border: string; color: string }
      > = {
        info: { bg: '#eff6ff', border: '#3b82f6', color: '#1e40af' },
        success: { bg: '#f0fdf4', border: '#22c55e', color: '#166534' },
        warning: { bg: '#fffbeb', border: '#f59e0b', color: '#92400e' },
        tip: { bg: '#f0fdfa', border: '#14b8a6', color: '#115e59' },
        important: { bg: '#fef2f2', border: '#ef4444', color: '#991b1b' },
      };
      const s = variantStyles[variant] ?? variantStyles.info;
      return (
        <EditorBlockWrapper>
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: s.bg,
              borderLeft: `4px solid ${s.border}`,
              borderRadius: 4,
            }}
          >
            {data.props?.title && (
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: s.color,
                  marginBottom: 4,
                }}
              >
                {previewText(data.props.title, preview)}
              </div>
            )}
            <div style={{ fontSize: 13, color: s.color, lineHeight: 1.5 }}>
              {previewText(data.props?.text, preview) || 'Callout text goes here.'}
            </div>
          </div>
        </EditorBlockWrapper>
      );
    },
  },
  List: {
    schema: ListPropsSchema,
    Component: (data) => {
      const items = data.props?.items ?? ['Item one', 'Item two', 'Item three'];
      const type = data.props?.type ?? 'bullet';
      const markerColor = data.props?.markerColor ?? '#333';
      return (
        <EditorBlockWrapper>
          <div style={{ padding: '12px 24px' }}>
            {items.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 6,
                  fontSize: 14,
                  color: '#333',
                }}
              >
                <span style={{ color: markerColor, fontWeight: 600, minWidth: 16 }}>
                  {type === 'bullet'
                    ? '•'
                    : type === 'number'
                      ? `${i + 1}.`
                      : '✓'}
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </EditorBlockWrapper>
      );
    },
  },
  ButtonGroup: {
    schema: ButtonGroupPropsSchema,
    Component: (data) => {
      const buttons = data.props?.buttons ?? [
        { text: 'Primary', href: '#' },
        { text: 'Secondary', href: '#' },
      ];
      const align = data.props?.align ?? 'center';
      return (
        <EditorBlockWrapper>
          <div
            style={{
              padding: '16px 24px',
              display: 'flex',
              justifyContent:
                align === 'left'
                  ? 'flex-start'
                  : align === 'right'
                    ? 'flex-end'
                    : 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            {buttons.map((btn, i) => (
              <div
                key={i}
                style={{
                  padding: '10px 20px',
                  backgroundColor: i === 0 ? '#52796f' : 'transparent',
                  color: i === 0 ? '#fff' : '#52796f',
                  border: i === 0 ? 'none' : '1px solid #52796f',
                  borderRadius: 4,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                {btn.text}
              </div>
            ))}
          </div>
        </EditorBlockWrapper>
      );
    },
  },
  Hero: {
    schema: HeroPropsSchema,
    Component: (data) => {
      const preview = useIsPreview();
      const imagePosition = data.props?.imagePosition ?? 'top';
      const bgColor = data.props?.contentBackgroundColor ?? '#f8f8f8';
      const content = (
        <div style={{ flex: 1, padding: '32px 24px' }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#2f3e46',
              lineHeight: 1.2,
              marginBottom: 12,
            }}
          >
            {previewText(data.props?.headline, preview) || 'Hero Headline'}
          </div>
          <div
            style={{
              fontSize: 15,
              color: '#555',
              lineHeight: 1.5,
              marginBottom: 20,
            }}
          >
            {previewText(data.props?.description, preview) ||
              'Supporting description text goes here.'}
          </div>
          {(data.props?.buttonText || data.props?.buttonHref) && (
            <div
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#52796f',
                color: '#fff',
                borderRadius: 4,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {previewText(data.props?.buttonText, preview) || 'Get Started'}
            </div>
          )}
        </div>
      );
      const image = data.props?.imageUrl ? (
        <div style={{ flex: 1 }}>
          <img
            src={data.props.imageUrl}
            alt={data.props?.imageAlt ?? ''}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>
      ) : null;
      return (
        <EditorBlockWrapper>
          <div style={{ backgroundColor: bgColor }}>
            {imagePosition === 'right' ? (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {content}
                {image}
              </div>
            ) : imagePosition === 'top' ? (
              <>
                {image}
                {content}
              </>
            ) : (
              <>
                {content}
                {image}
              </>
            )}
            {!image && imagePosition !== 'right' && (
              <div
                style={{
                  height: 120,
                  backgroundColor: '#e8e8e8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  color: '#999',
                }}
              >
                Image placeholder
              </div>
            )}
          </div>
        </EditorBlockWrapper>
      );
    },
  },
  Gallery: {
    schema: GalleryPropsSchema,
    Component: (data) => {
      const variant = data.props?.variant ?? 'grid';
      const images = (data.props?.images as { src: string; alt: string; href: string }[] | null) ?? [];
      return (
        <EditorBlockWrapper>
          <div style={{ padding: '24px' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#2f3e46', marginBottom: 8 }}>
              {data.props?.heading || 'Gallery Heading'}
            </div>
            {data.props?.description && (
              <div style={{ fontSize: 14, color: '#666', marginBottom: 16, lineHeight: 1.5 }}>
                {data.props.description}
              </div>
            )}
            {variant === 'featured' ? (
              <div>
                {images.length > 0 ? (
                  <img
                    src={images[0].src}
                    alt={images[0].alt}
                    style={{ width: '100%', height: 288, objectFit: 'cover', borderRadius: 12 }}
                  />
                ) : (
                  <div style={{ width: '100%', height: 288, backgroundColor: '#e8e8e8', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#999' }}>
                    Featured image placeholder
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {(images.length > 0 ? images.slice(0, 4) : Array.from({ length: 4 })).map((img, i) => (
                  <div key={i}>
                    {img && (img as { src: string }).src ? (
                      <img
                        src={(img as { src: string; alt: string }).src}
                        alt={(img as { src: string; alt: string }).alt}
                        style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 12 }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: 140, backgroundColor: '#e8e8e8', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#999' }}>
                        Image {i + 1}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </EditorBlockWrapper>
      );
    },
  },
  Article: {
    schema: ArticlePropsSchema,
    Component: (data) => {
      const variant = data.props?.variant ?? 'hero';
      const imageEl = data.props?.imageUrl ? (
        <img
          src={data.props.imageUrl}
          alt={data.props?.imageAlt ?? ''}
          style={{ width: '100%', height: 'auto', borderRadius: 12, display: 'block' }}
        />
      ) : (
        <div style={{ width: '100%', height: 200, backgroundColor: '#e8e8e8', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#999' }}>
          Article image
        </div>
      );
      const textContent = (
        <div style={{ padding: variant === 'horizontal' ? '0' : '0 0 0 0' }}>
          <div style={{ fontSize: variant === 'hero' ? 28 : 18, fontWeight: 700, color: '#2f3e46', lineHeight: 1.2, marginBottom: 8 }}>
            {data.props?.heading || 'Article Title'}
          </div>
          {data.props?.description && (
            <div style={{ fontSize: 14, color: '#555', lineHeight: 1.5, marginBottom: 16 }}>
              {data.props.description}
            </div>
          )}
          {(data.props?.buttonText || data.props?.buttonHref) && (
            <div style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#52796f', color: '#fff', borderRadius: 4, fontSize: 14, fontWeight: 600 }}>
              {data.props?.buttonText || 'Read more'}
            </div>
          )}
        </div>
      );

      if (variant === 'horizontal') {
        return (
          <EditorBlockWrapper>
            <div style={{ padding: '24px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>{imageEl}</div>
              <div style={{ flex: 1 }}>{textContent}</div>
            </div>
          </EditorBlockWrapper>
        );
      }

      return (
        <EditorBlockWrapper>
          <div style={{ padding: '24px' }}>
            {imageEl}
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              {textContent}
            </div>
          </div>
        </EditorBlockWrapper>
      );
    },
  },
});

// ---------------------------------------------------------------------------
// Schemas & types
// ---------------------------------------------------------------------------

export const EditorBlockSchema = buildBlockConfigurationSchema(EDITOR_DICTIONARY);
export type TEditorBlock = z.infer<typeof EditorBlockSchema>;

export const EditorConfigurationSchema = z.record(z.string(), EditorBlockSchema);
export type TEditorConfiguration = z.infer<typeof EditorConfigurationSchema>;

// ---------------------------------------------------------------------------
// Context for passing the document down
// ---------------------------------------------------------------------------

const EditorDocumentContext = createContext<TEditorDocument>({});

export function useEditorDocument() {
  return useContext(EditorDocumentContext);
}

// ---------------------------------------------------------------------------
// Core block renderer
// ---------------------------------------------------------------------------

const BaseEditorBlock = buildBlockComponent(EDITOR_DICTIONARY);

export function CoreEditorBlock({ id }: { id: string }) {
  const block = useEditorDocumentStore(
    useCallback((s) => s.document[id], [id])
  );
  if (!block) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <BaseEditorBlock {...(block as any)} />;
}

// ---------------------------------------------------------------------------
// Provider wrapper (optional convenience)
// ---------------------------------------------------------------------------

export function EditorDocumentProvider({
  document,
  children,
}: {
  document: TEditorDocument;
  children: React.ReactNode;
}) {
  return (
    <EditorDocumentContext.Provider value={document}>
      {children}
    </EditorDocumentContext.Provider>
  );
}
