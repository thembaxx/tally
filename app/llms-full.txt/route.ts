import { fullLessonsText } from '@/lib/llms';
export const dynamic = 'force-static';
export function GET() {
  return new Response(fullLessonsText(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' },
  });
}
