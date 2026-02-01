/**
 * LO Review Widget styles — injected into Shadow DOM alongside BASE_STYLES.
 */

export const LO_REVIEW_STYLES = /* css */ `
  .rw-lo-profile {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    margin-bottom: 16px;
    background: var(--rw-bg, #fff);
    border: 1px solid var(--rw-border, #e5e7eb);
    border-radius: var(--rw-radius, 8px);
  }

  .rw-lo-profile__photo {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    background: #e5e7eb;
  }

  .rw-lo-profile__photo-placeholder {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: var(--rw-primary, #52796f);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .rw-lo-profile__info { flex: 1; min-width: 0; }

  .rw-lo-profile__name {
    font-size: 18px;
    font-weight: 700;
    color: var(--rw-text, #1a1a2e);
    margin-bottom: 2px;
    line-height: 1.3;
  }

  .rw-lo-profile__title { font-size: 13px; color: #6b7280; margin-bottom: 4px; }
  .rw-lo-profile__nmls { font-size: 12px; color: #6b7280; }
  .rw-lo-profile__nmls a { color: var(--rw-primary, #52796f); text-decoration: none; }
  .rw-lo-profile__nmls a:hover { text-decoration: underline; }

  .rw-lo-profile__licensed-states {
    font-size: 12px;
    color: #6b7280;
    margin-top: 4px;
  }

  .rw-lo-profile__rating { display: flex; align-items: center; gap: 8px; margin-top: 6px; }

  .rw-lo-profile__rating-value {
    font-size: 24px;
    font-weight: 700;
    color: var(--rw-text, #1a1a2e);
    line-height: 1;
  }

  .rw-lo-profile__rating-count { font-size: 13px; color: #6b7280; }

  .rw-lo-reviews { display: grid; gap: 12px; grid-template-columns: 1fr; }

  .rw-lo-review {
    padding: 16px;
    border-radius: var(--rw-radius, 8px);
    transition: box-shadow 0.15s ease;
  }

  .rw-lo-review--bordered { border: 1px solid var(--rw-border, #e5e7eb); background: #fff; }
  .rw-lo-review--shadow { background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04); }
  .rw-lo-review--flat { background: #f9fafb; }
  .rw-lo-review:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }

  .rw-lo-review__header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }

  .rw-lo-review__avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 14px;
    color: #6b7280;
    flex-shrink: 0;
  }

  .rw-lo-review__meta { flex: 1; min-width: 0; }

  .rw-lo-review__name {
    font-weight: 600;
    font-size: 14px;
    color: var(--rw-text, #1a1a2e);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .rw-lo-review__date { font-size: 12px; color: #9ca3af; }
  .rw-lo-review__stars { display: flex; gap: 2px; margin-bottom: 8px; }
  .rw-lo-review__text { font-size: 14px; line-height: 1.6; color: #374151; }
  .rw-lo-review__text--truncated { cursor: pointer; }

  .rw-lo-review__text--truncated::after {
    content: " Read more";
    color: var(--rw-primary, #52796f);
    font-weight: 500;
  }

  .rw-lo-review__tags { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 10px; }
  .rw-lo-review__source { font-size: 11px; color: #9ca3af; text-transform: capitalize; }

  .rw-lo-review__loan-tag { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 500; white-space: nowrap; }
  .rw-lo-review__loan-tag--purchase { background: #dbeafe; color: #1e40af; }
  .rw-lo-review__loan-tag--refinance { background: #fef3c7; color: #92400e; }
  .rw-lo-review__loan-tag--va { background: #d1fae5; color: #065f46; }
  .rw-lo-review__loan-tag--fha { background: #ede9fe; color: #5b21b6; }
  .rw-lo-review__loan-tag--jumbo { background: #fce7f3; color: #9d174d; }
  .rw-lo-review__loan-tag--usda { background: #fef9c3; color: #854d0e; }
  .rw-lo-review__loan-tag--conventional { background: #f0f9ff; color: #075985; }
  .rw-lo-review__loan-tag--default { background: #f3f4f6; color: #4b5563; }

  .rw-lo-review__fthb-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 10px;
    font-weight: 500;
    background: #ecfdf5;
    color: #047857;
    white-space: nowrap;
  }

  .rw-lo-actions { display: flex; gap: 12px; margin-top: 16px; flex-wrap: wrap; }

  .rw-lo-actions__write-review {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 500;
    color: var(--rw-primary, #52796f);
    background: transparent;
    border: 1px solid var(--rw-primary, #52796f);
    border-radius: 6px;
    text-decoration: none;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .rw-lo-actions__write-review:hover { background: var(--rw-primary, #52796f); color: #fff; }

  .rw-lo-disclaimer {
    margin-top: 16px;
    padding: 10px 14px;
    font-size: 10px;
    line-height: 1.5;
    color: #6b7280;
    background: #f9fafb;
    border-radius: 4px;
    border: 1px solid #f3f4f6;
  }

  .rw-lo-disclaimer__ehl {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
    font-weight: 600;
    font-size: 11px;
    color: #4b5563;
  }

  .rw-lo-disclaimer__text {
    font-size: 10px;
    line-height: 1.5;
    color: #6b7280;
    margin-bottom: 4px;
  }

  .rw-lo-disclaimer__nmls-link {
    font-size: 10px;
    color: var(--rw-primary, #52796f);
    text-decoration: none;
  }

  .rw-lo-disclaimer__nmls-link:hover { text-decoration: underline; }

  @media (max-width: 480px) {
    .rw-lo-profile { flex-direction: column; text-align: center; }
    .rw-lo-profile__states { justify-content: center; }
    .rw-lo-profile__rating { justify-content: center; }
    .rw-lo-reviews { grid-template-columns: 1fr !important; }
    .rw-lo-actions { flex-direction: column; }
    .rw-lo-actions__write-review, .rw-cta { width: 100%; text-align: center; justify-content: center; }
  }
`;
