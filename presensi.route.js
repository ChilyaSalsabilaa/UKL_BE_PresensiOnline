const express = require('express');
const app = express()
app.use(express.json())
const presensiController = require('../controllers/presensi.controller');
//const { authorize } = require('../controllers/auth.controller'); // Middleware autentikasi
const { authorize } = require(`../controllers/auth.controller`)
// Rute untuk menambahkan presensi
app.post('/', presensiController.addpresensi);

// Rute untuk mendapatkan presensi berdasarkan userId
app.get('/:userId', presensiController.getpresensiById);
app.get(`/history/:user_id`, presensiController.getHistory);

// Rute untuk mendapatkan ringkasan presensi bulanan
app.get('/monthly/:user_id/:month/:year', presensiController.getMonthlypresensiSummary);
//const presensiController = require('../controllers/presensi.controller'); // Pastikan path benar
// Rute untuk analisis presensi
app.post('/analysis', presensiController.analyzepresensi);                                                                                              1

module.exports = app;

/** Function to get attendance summary for a specific month */
exports.getMonthlySummary = async (req, res) => {
    const { month, user_id } = req.query; // Extract the month and user_id from query params

    if (!month || !user_id) {
        return res.status(400).json({
            status: "error",
            message: 'month and user_id are required'
        });
    }

    try {
        // Parse the month into start and end date
        const [monthPart, year] = month.split('-');
        const startDate = new Date(`${year}-${monthPart}-01T00:00:00Z`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0); // Set to the last day of the month

        // Filter presensi data by user_id and date range (current month)
        const presensis = await presensi.findAll({
            where: {
                user_id: user_id,
                date: {
                    [Op.between]: [startDate, endDate]
                }
            }
        });

        if (presensis.length === 0) {
            return res.status(404).json({
                status: "error",
                message: 'No attendance records found for the given user in the specified month'
            });
        }

        // Count attendance status
        const attendanceSummary = {
            hadir: presensis.filter(presensi => presensi.status === 'hadir').length,
            izin: presensis.filter(presensi => presensi.status === 'izin').length,
            sakit: presensis.filter(presensi => presensi.status === 'sakit').length,
            alpha: presensis.filter(presensi => presensi.status === 'alpha').length,
        };

        // Return the response with the required structure
        return res.json({
            status: "success",
            data: {
                user_id: user_id,
                month: month,
                attendance_summary: attendanceSummary
            },
            message: 'Monthly attendance summary fetched successfully'
        });

    } catch (error) {
        console.error('Error fetching monthly attendance summary:', error);
        return res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};

