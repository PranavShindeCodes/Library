import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import multer from "multer";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

/* ================= CLOUDINARY ================= */

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

/* ================= MONGOOSE SCHEMA ================= */

console.log(process.env.MONGO_URI);

const pdfSchema = new mongoose.Schema({
    name: String,
    std: String,
    year: String,
    sem: String,
    url: String,
});

const Pdf = mongoose.model("pdf", pdfSchema);

/* ================= MULTER (LOCAL STORAGE) ================= */

const upload = multer({ dest: "uploads/" });

/* ================= UPLOAD API ================= */

app.post("/upload-pdf", upload.single("file"), async (req, res) => {
    try {
        const { name, std, year, sem } = req.body;

        // ✅ FIX: ensure proper PDF handling
        const result = await cloudinary.uploader.upload(req.file.path, {
            resource_type: "raw",
            folder: "pdf_uploads",
            public_id: req.file.originalname.split(".")[0], // keep filename
            format: "pdf", // force pdf format
        });

        // delete local file after upload
        fs.unlinkSync(req.file.path);

        const newPdf = new Pdf({
            name,
            std,
            year,
            sem,
            url: result.secure_url, // ✅ already correct now
        });

        await newPdf.save();

        res.json({
            message: "PDF Uploaded Successfully 🚀",
            data: newPdf,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
});

/* ================= GET ALL PDF ================= */

app.get("/pdfs", async (req, res) => {
    try {
        const data = await Pdf.find();
        res.json(data);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
});

/* ================= DOWNLOAD API (FIXED) ================= */

app.get("/download/:id", async (req, res) => {
    try {
        const pdf = await Pdf.findById(req.params.id);

        if (!pdf) {
            return res.status(404).json({ message: "PDF not found" });
        }

        // ✅ FIX: force download with proper filename
        const downloadUrl = pdf.url.replace(
            "/upload/",
            `/upload/fl_attachment:${pdf.name}.pdf/`
        );

        res.redirect(downloadUrl);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/* ================= DB CONNECT ================= */

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected ✅");

        app.listen(1000, () => {
            console.log("Server running on port 1000 🚀");
        });
    })
    .catch((err) => console.log(err));