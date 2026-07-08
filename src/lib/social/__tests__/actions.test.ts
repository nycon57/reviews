import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  createAdminClientMock,
  createUntypedAdminClientMock,
  unifiedGetUserMock,
  revalidatePathMock,
  exchangeCodeForTokensMock,
  refreshAccessTokenMock,
  getUserInfoMock,
  getFacebookPagesMock,
  getLinkedInPagesMock,
  getAuthorizationUrlMock,
  isTokenExpiredMock,
  postToFacebookMock,
  postToTwitterMock,
  postToLinkedInMock,
  postToInstagramMock,
  ensureSmartLinkForSourceMock,
} = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
  createUntypedAdminClientMock: vi.fn(),
  unifiedGetUserMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  exchangeCodeForTokensMock: vi.fn(),
  refreshAccessTokenMock: vi.fn(),
  getUserInfoMock: vi.fn(),
  getFacebookPagesMock: vi.fn(),
  getLinkedInPagesMock: vi.fn(),
  getAuthorizationUrlMock: vi.fn(),
  isTokenExpiredMock: vi.fn(),
  postToFacebookMock: vi.fn(),
  postToTwitterMock: vi.fn(),
  postToLinkedInMock: vi.fn(),
  postToInstagramMock: vi.fn(),
  ensureSmartLinkForSourceMock: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
  createUntypedAdminClient: createUntypedAdminClientMock,
}));

vi.mock('@/lib/auth/actions', () => ({
  unifiedGetUser: unifiedGetUserMock,
}));

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock('@/lib/share-studio/service', () => ({
  ensureSmartLinkForSource: ensureSmartLinkForSourceMock,
}));

vi.mock('../client', () => ({
  exchangeCodeForTokens: exchangeCodeForTokensMock,
  refreshAccessToken: refreshAccessTokenMock,
  getUserInfo: getUserInfoMock,
  getFacebookPages: getFacebookPagesMock,
  getLinkedInPages: getLinkedInPagesMock,
  getAuthorizationUrl: getAuthorizationUrlMock,
  isTokenExpired: isTokenExpiredMock,
  postToFacebook: postToFacebookMock,
  postToTwitter: postToTwitterMock,
  postToLinkedIn: postToLinkedInMock,
  postToInstagram: postToInstagramMock,
}));

import { handleSocialOAuthCallback, initiateSocialOAuth } from '../actions';

function createUserContextClient() {
  const singleMock = vi.fn().mockResolvedValue({
    data: {
      id: 'manager-1',
      organization_id: 'org-1',
      role: 'manager',
    },
    error: null,
  });

  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: singleMock,
        })),
      })),
    })),
  };
}

function createSocialClient(options?: {
  existingConnection?: { id: string } | null;
  insertedConnectionId?: string;
}) {
  const existingConnection = options?.existingConnection ?? null;
  const insertedConnectionId = options?.insertedConnectionId ?? 'connection-1';

  const insertMock = vi.fn((payload: Record<string, unknown>) => ({
    select: vi.fn(() => ({
      single: vi.fn().mockResolvedValue({
        data: {
          id: insertedConnectionId,
          payload,
        },
        error: null,
      }),
    })),
  }));

  const updateMock = vi.fn(() => ({
    eq: vi.fn(() => Promise.resolve({ error: null })),
  }));

  const selectMock = vi.fn(() => {
    const query = {
      eq: vi.fn(() => query),
      single: vi.fn().mockResolvedValue({
        data: existingConnection,
        error: null,
      }),
    };

    return query;
  });

  return {
    client: {
      from: vi.fn(() => ({
        select: selectMock,
        insert: insertMock,
        update: updateMock,
      })),
    },
    insertMock,
    updateMock,
  };
}

function tamperSignedState(state: string): string {
  const lastChar = state.slice(-1);
  const replacement = lastChar === 'a' ? 'b' : 'a';
  return `${state.slice(0, -1)}${replacement}`;
}

describe('social OAuth state hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SOCIAL_OAUTH_STATE_SECRET = 'social-oauth-test-secret';

    unifiedGetUserMock.mockResolvedValue({ id: 'manager-1' });
    createAdminClientMock.mockReturnValue(createUserContextClient());
    getAuthorizationUrlMock.mockImplementation((platform: string, state: string) =>
      `https://provider.example/${platform}?state=${encodeURIComponent(state)}`
    );

    exchangeCodeForTokensMock.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: new Date('2026-03-09T12:00:00.000Z'),
      scope: 'basic',
    });
    getUserInfoMock.mockResolvedValue({
      id: 'platform-user-1',
      username: 'repwell-social',
      displayName: 'Repwell Social',
      profileUrl: 'https://social.example/profile',
      avatarUrl: 'https://social.example/avatar.png',
    });
    getFacebookPagesMock.mockResolvedValue([]);
    getLinkedInPagesMock.mockResolvedValue([]);
  });

  it('rejects tampered OAuth state before exchanging tokens', async () => {
    const { success, data } = await initiateSocialOAuth('twitter');

    expect(success).toBe(true);
    const state = new URL(data!.url).searchParams.get('state');
    expect(state).toBeTruthy();

    const result = await handleSocialOAuthCallback(
      'twitter',
      'oauth-code',
      tamperSignedState(state!)
    );

    expect(result).toEqual({
      success: false,
      error: 'Invalid OAuth state',
    });
    expect(exchangeCodeForTokensMock).not.toHaveBeenCalled();
  });

  it('rejects platform-mismatched signed state before exchanging tokens', async () => {
    const { data } = await initiateSocialOAuth('facebook');
    const state = new URL(data!.url).searchParams.get('state');

    const result = await handleSocialOAuthCallback(
      'twitter',
      'oauth-code',
      state!
    );

    expect(result).toEqual({
      success: false,
      error: 'OAuth state platform mismatch',
    });
    expect(exchangeCodeForTokensMock).not.toHaveBeenCalled();
  });

  it('accepts a valid signed state and persists the connection in the signed organization', async () => {
    const { client, insertMock } = createSocialClient();
    createUntypedAdminClientMock.mockReturnValue(client);

    const { data } = await initiateSocialOAuth('twitter');
    const state = new URL(data!.url).searchParams.get('state');

    const result = await handleSocialOAuthCallback(
      'twitter',
      'oauth-code',
      state!
    );

    expect(result).toEqual({
      success: true,
      data: {
        connectionId: 'connection-1',
      },
    });
    expect(exchangeCodeForTokensMock).toHaveBeenCalledWith('twitter', 'oauth-code');
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: 'org-1',
        platform: 'twitter',
        platform_user_id: 'platform-user-1',
      })
    );
    expect(revalidatePathMock).toHaveBeenCalledWith('/dashboard/organization');
  });
});
