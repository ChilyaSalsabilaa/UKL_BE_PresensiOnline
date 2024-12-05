//const { presensi } = require('../models'); // Import langsung dari index.js
const { Op, fn, col, literal } = require('sequelize');
const presensi = require(`../models/index`).presensi;
const siswa = require(`../models/index`).siswa;
const moment = require('moment'); // Untuk format tanggal

exports.addpresensi = (request, response) => {
    const { user_id, date, time, status } = request.body;

    presensi.create({ user_id, date, time, status })
        .then(result => {
            const presensiData = {
                user_id: result.id,
                user_id: result.user_id,
                date: moment(result.date).format('YYYY-MM-DD'),
                time: result.time,
                status: result.status,
            };
            return response.json({
                status: 'success',
                message: 'presensi recorded successfully',
                data: presensiData,
            });
        })
        .catch(error => {
            return response.status(500).json({
                success: false,
                message: `Error recording presensi: ${error.message}`,
            });
        });
};

exports.getpresensiById = async (request, response) => {
    const { user_id } = request.params;

    presensi.findAll({ where: { user_id } })
        .then(presensiData => {
            if (!presensiData.length) {
                return response.status(404).json({
                    success: false,
                    message: `No presensi record found for user ID ${user_id}`,
                });
            }
            const formattedData = presensiData.map(item => ({
                user_id: item.id,
                date: item.date,
                time: item.time,
                status: item.status,
            }));
            return response.json({
                status: 'success',
                data: formattedData,
            });
        })
        .catch(error => {
            return response.status(500).json({
                success: false,
                message: `Error retrieving presensi: ${error.message}`,
            });
        });
};

exports.getHistory = async (request, response) => {
    try {
        const user_id = request.params.user_id;

        if (!user_id) {
            return response.status(400).json({
                status: 'failed',
                message: 'User ID harus disertakan dalam URL',
            });
        }

        const history = await presensi.findAll({
            where: { user_id },
            order: [['date', 'DESC'], ['time', 'DESC']],
        });

        if (!history.length) {
            return response.status(404).json({
                status: 'failed',
                message: 'Riwayat presensi tidak ditemukan untuk user ID ini',
            });
        }

        const formattedHistory = history.map(record => ({
            user_id: record.id,
            date: record.date.toISOString().split('T')[0],
            time: record.time,
            status: record.status,
        }));

        return response.json({
            status: 'success',
            data: formattedHistory,
        });
    } catch (error) {
        console.error('Error:', error.message);
        return response.status(500).json({
            status: 'failed',
            message: `Terjadi kesalahan pada server: ${error.message}`,
        });
    }
};
exports.getMonthlypresensiSummary = (request, response) => {
    const { user_id } = request.params;
    const year = request.query.year || moment().format('YYYY');
    const month = request.query.month || moment().format('MM');
    const formattedMonth = month.toString().padStart(2, '0');

    presensi.findAll({
        where: {
            user_id: user_id,
            date: {
                [Op.between]: [`${year}-${formattedMonth}-01`, `${year}-${formattedMonth}-31`],
            },
        },
        attributes: [
            [fn('MONTH', col('date')), 'month'],
            [fn('YEAR', col('date')), 'year'],
            [fn('COUNT', col('status')), 'total'],
            [literal("SUM(CASE WHEN status = 'hadir' THEN 1 ELSE 0 END)"), 'hadir'],
            [literal("SUM(CASE WHEN status = 'izin' THEN 1 ELSE 0 END)"), 'izin'],
            [literal("SUM(CASE WHEN status = 'sakit' THEN 1 ELSE 0 END)"), 'sakit'],
            [literal("SUM(CASE WHEN status = 'alpha' THEN 1 ELSE 0 END)"), 'alpha'],
        ],
        group: ['year', 'month'],
        raw: true,
    })
        .then(data => {
            if (!data.length) {
                return response.status(404).json({
                    success: false,
                    message: `No presensi records found for user ID ${user_id} in ${year}-${formattedMonth}`,
                });
            }
            const summary = {
                user_id,
                month: `${formattedMonth}-${year}`,
                presensiSummary: {
                    hadir: data[0].hadir,
                    izin: data[0].izin,
                    sakit: data[0].sakit,
                    alpha: data[0].alpha,
                },
            };
            return response.json({
                status: 'success',
                data: summary,
            });
        })
        .catch(error => {
            return response.status(500).json({
                success: false,
                message: `Error retrieving monthly presensi summary: ${error.message}`,
            });
        });
};
exports.analyzepresensi = (request, response) => {
    const { start_date, end_date, group_by } = request.body;

    if (!start_date || !end_date || !group_by) {
        return response.status(400).json({
            success: false,
            message: 'Missing required parameters: start_date, end_date, or group_by.',
        });
    }

    presensi.findAll({
        where: {
            date: {
                [Op.between]: [start_date, end_date],
            },
        },
        include: [{
            model: siswa,
            as: 'siswa', // Gunakan alias relasi
            attributes: ['role'],
        }],
        attributes: [
            [col('siswa.role'), 'group'],
            [fn('COUNT', col('user_id')), 'total_users'],
            [literal("SUM(CASE WHEN status = 'hadir' THEN 1 ELSE 0 END)"), 'hadir_count'],
            [literal("SUM(CASE WHEN status = 'izin' THEN 1 ELSE 0 END)"), 'izin_count'],
            [literal("SUM(CASE WHEN status = 'sakit' THEN 1 ELSE 0 END)"), 'sakit_count'],
            [literal("SUM(CASE WHEN status = 'alpha' THEN 1 ELSE 0 END)"), 'alpha_count'],
            [literal("COUNT(*)"), 'total_records'],
        ],
        group: [col('siswa.role')],
        raw: true,
    })
        .then(data => {
            if (!data.length) {
                return response.status(404).json({
                    success: false,
                    message: 'No presensi records found for the given period and parameters.',
                });
            }

            const groupedAnalysis = data.map(item => {
                const totalRecords = parseInt(item.total_records, 10);
                return {
                    group: item.group,
                    total_users: parseInt(item.total_users, 10),
                    presensi_rate: {
                        hadir_percentage: ((parseInt(item.hadir_count, 10) / totalRecords) * 100).toFixed(2),
                        izin_percentage: ((parseInt(item.izin_count, 10) / totalRecords) * 100).toFixed(2),
                        sakit_percentage: ((parseInt(item.sakit_count, 10) / totalRecords) * 100).toFixed(2),
                        alpha_percentage: ((parseInt(item.alpha_count, 10) / totalRecords) * 100).toFixed(2),
                    },
                    total_presensi: {
                        hadir: parseInt(item.hadir_count, 10),
                        izin: parseInt(item.izin_count, 10),
                        sakit: parseInt(item.sakit_count, 10),
                        alpha: parseInt(item.alpha_count, 10),
                    },
                };
            });

            return response.json({
                status: 'success',
                data: {
                    analysis_period: {
                        start_date,
                        end_date,
                    },
                    grouped_analysis: groupedAnalysis,
                },
            });
        })
        .catch(error => {
            return response.status(500).json({
                success: false,
                message: `Error analyzing presensi: ${error.message}`,
            });
        });
};

/** Function to get summary of attendance */
exports.getSummary = async (req, res) => {
    try {
        const presensis = await presensi.findAll(); // Atau filter berdasarkan status, tanggal, dll.

        // Count attendance status
        const summary = {
            hadir: presensis.filter(presensi => presensi.status === 'hadir').length,
            izin: presensis.filter(presensi => presensi.status === 'izin').length,
            sakit: presensis.filter(presensi => presensi.status === 'sakit').length,
            alpha: presensis.filter(presensi => presensi.status === 'alpha').length,
        };

        return res.json({
            success: true,
            data: summary,
            message: 'Attendance summary successfully fetched'
        });
    } catch (error) {
        console.error('Error fetching attendance summary:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/** Analyze attendance based on date range and group by category (e.g., siswa or karyawan) */
exports.postAnalysis = async (req, res) => {
    const { start_date, end_date, group_by } = req.body; // Ambil data dari request body

    if (!start_date || !end_date || !group_by) {
        return res.status(400).json({
            status: "error",
            message: 'start_date, end_date, and group_by are required'
        });
    }

    try {
        // Menyusun filter untuk tanggal dan kategori
        const whereConditions = {
            date: {
                [Op.between]: [start_date, end_date], // Rentang tanggal
            },
        };

        // Ambil data presensisi yang sesuai dengan filter
        const presensis = await presensi.findAll({
            where: whereConditions
        });

        if (presensis.length === 0) {
            return res.status(404).json({
                status: "error",
                message: 'No attendance records found for the given criteria'
            });
        }

        // Grouping data based on the 'group_by' category (e.g., "kelas", "jabatan", etc.)
        const groupedData = presensis.reduce((acc, presensi) => {
            const group = presensi[group_by]; // Grouping by the given group_by field
            if (!acc[group]) {
                acc[group] = {
                    group: group,
                    total_users: 0,
                    total_attendance: {
                        hadir: 0,
                        izin: 0,
                        sakit: 0,
                        alpha: 0
                    }
                };
            }

            acc[group].total_users += 1; // Increment the total users in that group

            // Count attendance status
            switch (presensi.status) {
                case 'hadir':
                    acc[group].total_attendance.hadir += 1;
                    break;
                case 'izin':
                    acc[group].total_attendance.izin += 1;
                    break;
                case 'sakit':
                    acc[group].total_attendance.sakit += 1;
                    break;
                case 'alpha':
                    acc[group].total_attendance.alpha += 1;
                    break;
            }

            return acc;
        }, {});

        // Convert grouped data to an array
        const groupedAnalysis = Object.values(groupedData).map(group => {
            const totalAttendance = group.total_attendance;
            const total = totalAttendance.hadir + totalAttendance.izin + totalAttendance.sakit + totalAttendance.alpha;

            // Calculate percentages
            const attendanceRate = {
                hadir_percentage: (totalAttendance.hadir / total) * 100,
                izin_percentage: (totalAttendance.izin / total) * 100,
                sakit_percentage: (totalAttendance.sakit / total) * 100,
                alpa_percentage: (totalAttendance.alpha / total) * 100,
            };

            return {
                group: group.group,
                total_users: group.total_users,
                attendance_rate: attendanceRate,
                total_attendance: totalAttendance
            };
        });

        // Return the response with the required structure
        return res.json({
            status: "success",
            data: {
                analysis_period: {
                    start_date: start_date,
                    end_date: end_date
                },
                grouped_analysis: groupedAnalysis
            },
            message: 'Attendance analysis by period and group completed successfully'
        });

    } catch (error) {
        console.error('Error analyzing attendance:', error);
        return res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};

