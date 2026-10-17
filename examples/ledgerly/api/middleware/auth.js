// Authentication: who is calling. Verifies the session token and sets req.user.
// It says nothing about which records the caller may touch; each route decides that.
import { verifySession } from "../session.js";

export async function requireSession(req, res, next) {
  const session = await verifySession(req.headers.authorization);
  if (!session) return res.status(401).json({ error: "not signed in" });
  req.user = { id: session.userId, orgId: session.orgId, role: session.role };
  next();
}
