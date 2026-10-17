import { Router } from "express";
import { db } from "../db.js";
import { requireSession } from "../middleware/auth.js";

export const invoices = Router();
invoices.use(requireSession);

// The list is scoped to the caller's organization.
invoices.get("/invoices", async (req, res) => {
  res.json(await db.any("select * from invoices where org_id = $1 order by id desc", [req.user.orgId]));
});

// F-1: by ID, nothing checks that the invoice is the caller's organization's.
invoices.get("/invoices/:id", async (req, res) => {
  const invoice = await db.oneOrNone("select * from invoices where id = $1", [req.params.id]);
  if (!invoice) return res.status(404).end();
  res.json(invoice);
});

invoices.patch("/invoices/:id/status", async (req, res) => {
  await db.none("update invoices set status = $1 where id = $2", [req.body.status, req.params.id]);
  res.status(204).end();
});
