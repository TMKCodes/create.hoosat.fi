import { createRouter } from "../core/server";
import { healthRouter } from "./health/health";
import { pingRouter } from "./ping/ping";

const APIRouter = createRouter();

APIRouter.UseRouter(pingRouter);
APIRouter.UseRouter(healthRouter);

export { APIRouter }
