export async function GET() {
  return Response.json({ ok: true, app: "poi-trader-os", version: "1.0.0" });
}
