import { serve } from "https://deno.land/std@0.187.0/http/server.ts";

serve(handle);

async function handle(request) {
  return new Response('Hello, World!');
}
