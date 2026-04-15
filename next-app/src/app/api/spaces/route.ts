import { queries } from "@/lib/db";

export async function GET() {
  const spaces = await queries.getSpaces();
  return Response.json(spaces);
}

export async function POST(request: Request) {
  const { name, type } = await request.json();

  if (!name?.trim() || !["university", "city"].includes(type)) {
    return Response.json({ error: "name and type (university|city) are required" }, { status: 400 });
  }

  // Generate a slug id from the name
  const id = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  await queries.createSpace(id, name.trim(), type);
  return Response.json({ id, name: name.trim(), type });
}
