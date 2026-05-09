import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import multer from "multer";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dns from "dns";

dotenv.config();

dns.setServers([
    "1.1.1.1",
    "8.8.8.8"
]);

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

/* ================= MULTER ================= */

const upload = multer({
    dest: "uploads/",
});

/* ================= UPLOAD API ================= */

app.post("/upload-pdf", upload.single("file"), async (req, res) => {

    try {

        const { name, std, year, sem } = req.body;

        if (!req.file) {
            return res.status(400).json({
                message: "PDF file required",
            });
        }

        // remove .pdf extension
        const fileName = req.file.originalname.replace(".pdf", "");

        /* ================= CLOUDINARY UPLOAD ================= */

        const result = await cloudinary.uploader.upload(req.file.path, {

            resource_type: "raw",

            folder: "pdf_uploads",

            public_id: fileName,

            use_filename: true,

            unique_filename: false,

        });

        /* ================= DELETE LOCAL FILE ================= */

        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        /* ================= SAVE DATABASE ================= */

        const newPdf = new Pdf({
            name,
            std,
            year,
            sem,
            url: result.secure_url,
        });

        await newPdf.save();

        res.status(200).json({

            message: "PDF Uploaded Successfully 🚀",

            data: newPdf,

        });

    } catch (error) {

        console.log(error);

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

/* ================= DOWNLOAD API ================= */

app.get("/download/:id", async (req, res) => {

    try {

        const pdf = await Pdf.findById(req.params.id);

        if (!pdf) {

            return res.status(404).json({

                message: "PDF not found",

            });
        }

        // get filename
        const fileName = pdf.url.split("/").pop();

        // force download with filename
        const downloadUrl = pdf.url.replace(

            "/upload/",

            `/upload/fl_attachment:${fileName}/`

        );

        res.redirect(downloadUrl);

    } catch (error) {

        res.status(500).json({

            message: error.message,

        });
    }
});

/* ================= DATABASE ================= */

mongoose
    .connect(process.env.MONGO_URI)

    .then(() => {

        console.log("MongoDB Connected ✅");

        app.listen(1000, () => {

            console.log("Server running on port 1000 🚀");

        });

    })

    .catch((err) => {

        console.log(err);

    });