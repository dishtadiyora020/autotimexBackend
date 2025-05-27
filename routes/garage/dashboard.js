import express from 'express'
import { isUserAuthorized } from '../../middleware/auth.js';
import dashboardController from '../../controllers/garage/dashboardController.js';

const router = express.Router()

router.get(
    "/get-dashboard-stats",
    isUserAuthorized(["Owner"]),
    dashboardController.getDashboardStats
);
router.get(
    "/get-journey-chart",
    isUserAuthorized(["Owner"]),
    dashboardController.getJourneyChart
);

router.get(
    "/advance-value",
    isUserAuthorized(["Owner"]),
    dashboardController.advanceValue
);

router.post(
    "/get-advance-dashboard-stats",
    isUserAuthorized(["Owner"]),
    dashboardController.getAdvanceDashboardStats
);
export default router;