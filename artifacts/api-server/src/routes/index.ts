import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aquasentinelRouter from "./aquasentinel";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aquasentinelRouter);
router.use(storageRouter);

export default router;
