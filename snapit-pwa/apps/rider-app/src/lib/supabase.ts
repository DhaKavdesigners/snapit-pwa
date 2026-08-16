/**
 * supabase.ts — Supabase client for SnapIt Rider App
 *
 * PHASE 1: Mock client. All real Supabase calls are stubbed.
 * TO ACTIVATE: Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
 *
 * The mock client implements the same interface signatures so swapping
 * to the real client requires only uncommenting the real import below.
 */

// ── Real client (uncomment when .env is populated) ─────────────────────────
// import { createClient } from '@supabase/supabase-js'
// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
// export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Phase 1: Mock client interface ─────────────────────────────────────────

type MockSubscription = {
  unsubscribe: () => void;
};

type MockChannel = {
  on: (event: string, filter: object, callback: (payload: unknown) => void) => MockChannel;
  subscribe: (cb?: (status: string) => void) => MockChannel;
  unsubscribe: () => void;
};

type MockStorageUploadResult = {
  data: { path: string } | null;
  error: { message: string } | null;
};



const createMockChannel = (): MockChannel => {
  const channel: MockChannel = {
    on: (_event, _filter, _callback) => channel,
    subscribe: (cb) => {
      if (cb) setTimeout(() => cb('SUBSCRIBED'), 100);
      return channel;
    },
    unsubscribe: () => {},
  };
  return channel;
};

/**
 * Mock Supabase client.
 * Replace this export with the real createClient() call when DB is ready.
 */
export const supabase = {
  from: (_table: string) => ({
    select: (_columns?: string) => ({
      eq: (_column: string, _value: unknown) => ({
        single: async () => ({ data: null, error: null }),
        order: (_col: string, _opts?: object) => ({
          limit: (_n: number) => Promise.resolve({ data: [], error: null }),
        }),
      }),
      order: (_col: string, _opts?: object) => ({
        limit: (_n: number) => Promise.resolve({ data: [], error: null }),
      }),
    }),
    update: (_payload: object) => ({
      eq: (_col: string, _val: unknown) => Promise.resolve({ data: null, error: null }),
    }),
    insert: (_payload: object) => Promise.resolve({ data: null, error: null }),
    upsert: (_payload: object) => Promise.resolve({ data: null, error: null }),
  }),

  channel: (_name: string): MockChannel => createMockChannel(),

  removeChannel: (_channel: MockChannel): void => {},

  storage: {
    from: (_bucket: string) => ({
      upload: async (
        _path: string,
        _file: File,
        _options?: object,
      ): Promise<MockStorageUploadResult> => {
        // Simulate upload delay
        await new Promise((r) => setTimeout(r, 1500));
        return { data: { path: _path }, error: null };
      },
      getPublicUrl: (_path: string) => ({
        // KYC bucket is PRIVATE — this should NEVER be called for snapit-kyc
        data: { publicUrl: '' },
      }),
      createSignedUrl: async (_path: string, _expiresIn: number) => ({
        data: { signedUrl: '' },
        error: null,
      }),
    }),
  },

  auth: {
    signInWithOtp: async (_opts: object) => ({ data: {}, error: null }),
    verifyOtp: async (_opts: object) => ({
      data: { user: null, session: null },
      error: null,
    }),
    signOut: async () => ({ error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: (_cb: Function): MockSubscription => ({
      unsubscribe: () => {},
    }),
  },
};
