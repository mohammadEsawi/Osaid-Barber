const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin'));

router.get('/dashboard', reportsController.getDashboard);
router.get('/bookings', reportsController.getBookingsReport);
router.get('/income', reportsController.getIncomeReport);
router.get('/products', reportsController.getProductsReport);
router.get('/barbers', reportsController.getBarbersReport);

module.exports = router;
