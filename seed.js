const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Measurement = require("./src/models/Measurement");

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        await Measurement.deleteMany();

        const data = [];
        const today = new Date();

        for (let i = 0; i < 200; i++) {
            const date = new Date();
            date.setDate(today.getDate() - i);

            data.push({
                timestamp: date,
                field1: Math.random() * 100,
                field2: Math.random() * 50,
                field3: Math.random() * 200
            });
        }

        await Measurement.insertMany(data);

        console.log("Data seeded successfully");
        process.exit();
    } catch (error) {
        console.error("Seeding error:", error);
        process.exit(1);
    }
};

seedData();
