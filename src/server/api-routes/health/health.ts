import { createRouter } from "../../core/server";

/**
 * Health check for load balancers, uptime monitors and the Docker HEALTHCHECK.
 */
const healthRouter = createRouter();

healthRouter.Get("/api/health", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ status: "ok", uptime: Math.round(process.uptime()) });
});

export { healthRouter };
