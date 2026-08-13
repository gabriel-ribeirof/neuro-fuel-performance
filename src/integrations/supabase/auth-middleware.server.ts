// Server-only. Middleware que valida o Bearer token do Supabase anexado pelo
// `attachSupabaseAuth` (client) e fornece `userId` + supabase autenticado
// (com RLS) para Server Functions protegidas.
import { createMiddleware } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_');
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization');
    }
    headers.set('apikey', supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

export const requireAuth = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  const url = process.env['SUPABASE_URL'];
  const publishableKey = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !publishableKey) {
    throw new Error("Unauthorized: Supabase não configurado");
  }

  const request = getRequest();
  if (!request?.headers) {
    throw new Error("Unauthorized: No request headers available");
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error("Unauthorized: No authorization header provided");
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token || token.split('.').length !== 3) {
    throw new Error("Unauthorized: Invalid token");
  }

  const supabase: SupabaseClient<Database> = createClient<Database>(url, publishableKey, {
    global: {
      fetch: createSupabaseFetch(publishableKey),
      headers: { Authorization: `Bearer ${token}` },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims || !data.claims.sub) {
    throw new Error("Unauthorized: Invalid token");
  }

  return next({
    context: { supabase, userId: data.claims.sub as string },
  });
});