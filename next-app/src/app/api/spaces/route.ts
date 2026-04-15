import { queries } from "@/lib/db";

export async function GET() {
  const spaces = await queries.getSpaces();
  return Response.json(spaces);
}
