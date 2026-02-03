const express = require("express");
const Measurement = require("../models/Measurement");


const router = express.Router();

const allowedFields = new Set(["field1", "field2", "field3"]);

function parseDateYYYYMMDD(value) {
    if (value === undefined || value === null) return null;

    const trimmed = String(value).trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return null;
    }

    const d = new Date(trimmed);
    if (isNaN(d.getTime())) {
        return null;
    }

    return d;
}

/**
 * GET /api/measurements
 * ?field=field1
 * &start_date=YYYY-MM-DD
 * &end_date=YYYY-MM-DD
 * &page=1
 * &limit=50
 */
router.get("/", async (req, res) => {
    try {
        const { field, start_date, end_date } = req.query;

        if (!field || !allowedFields.has(field)) {
            return res.status(400).json({
                message: "Invalid or missing 'field'. Use field1, field2, or field3"
            });
        }

        const start = parseDateYYYYMMDD(start_date);
        const end = parseDateYYYYMMDD(end_date);

        if (start_date && !start) {
            return res.status(400).json({
                message: "Invalid start_date format. Use YYYY-MM-DD"
            });
        }

        if (end_date && !end) {
            return res.status(400).json({
                message: "Invalid end_date format. Use YYYY-MM-DD"
            });
        }

        const filter = {};

        if (start || end) {
            filter.timestamp = {};
            if (start) filter.timestamp.$gte = start;
            if (end) {
                const endPlus = new Date(end);
                endPlus.setDate(endPlus.getDate() + 1);
                filter.timestamp.$lt = endPlus;
            }
        }

        const page = Math.max(parseInt(req.query.page || "1", 10), 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit || "50", 10), 1), 200);
        const skip = (page - 1) * limit;

        const total = await Measurement.countDocuments(filter);

        const docs = await Measurement.find(filter)
            .sort({ timestamp: 1 })
            .select({ timestamp: 1, [field]: 1, _id: 0 })
            .skip(skip)
            .limit(limit);

        const data = docs.map(doc => ({
            timestamp: doc.timestamp,
            value: doc[field]
        }));

        res.json({
            page,
            limit,
            total,
            data
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * GET /api/measurements/metrics
 * ?field=field1
 * &start_date=YYYY-MM-DD
 * &end_date=YYYY-MM-DD
 */
router.get("/metrics", async (req, res) => {
    try {
        const { field, start_date, end_date } = req.query;

        if (!field || !allowedFields.has(field)) {
            return res.status(400).json({
                message: "Invalid or missing 'field'. Use field1, field2, or field3"
            });
        }

        const start = parseDateYYYYMMDD(start_date);
        const end = parseDateYYYYMMDD(end_date);

        if (start_date && !start) {
            return res.status(400).json({
                message: "Invalid start_date format. Use YYYY-MM-DD"
            });
        }

        if (end_date && !end) {
            return res.status(400).json({
                message: "Invalid end_date format. Use YYYY-MM-DD"
            });
        }

        const match = {};

        if (start || end) {
            match.timestamp = {};
            if (start) match.timestamp.$gte = start;
            if (end) {
                const endPlus = new Date(end);
                endPlus.setDate(endPlus.getDate() + 1);
                match.timestamp.$lt = endPlus;
            }
        }

        const result = await Measurement.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    avg: { $avg: `$${field}` },
                    min: { $min: `$${field}` },
                    max: { $max: `$${field}` },
                    stdDev: { $stdDevPop: `$${field}` }
                }
            }
        ]);

        if (!result.length) {
            return res.status(404).json({
                message: "No data found for the specified range"
            });
        }

        const metrics = result[0];

        res.json({
            field,
            count: metrics.count,
            avg: metrics.avg,
            min: metrics.min,
            max: metrics.max,
            stdDev: metrics.stdDev
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
