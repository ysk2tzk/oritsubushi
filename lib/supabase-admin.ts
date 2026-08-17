import { createClient } from "@supabase/supabase-js";

let cachedClient: ReturnType<typeof createClient> | null = null;

class InertWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  binaryType: BinaryType = "arraybuffer";
  readyState = InertWebSocket.CLOSED;
  bufferedAmount = 0;
  onopen: (() => void) | null = null;
  onclose: ((event?: unknown) => void) | null = null;
  onerror: ((event?: unknown) => void) | null = null;
  onmessage: ((event?: unknown) => void) | null = null;

  close(_code?: number, _reason?: string) {
    this.readyState = InertWebSocket.CLOSED;
  }

  send(_data: string | ArrayBufferLike | Blob | ArrayBufferView) {}
}

export function getSupabaseAdmin() {
  if (cachedClient) {
    return cachedClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  cachedClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    realtime: {
      // This app uses the admin client for REST queries only.
      transport: InertWebSocket as unknown as typeof WebSocket
    }
  });

  return cachedClient;
}
