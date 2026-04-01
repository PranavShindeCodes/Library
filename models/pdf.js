import mongoose from "mongoose";
const pdfSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    std: {
        type: String,
        required: true,
    },
    year: {
        type: String,
        required: true,
    },
    sem: {
        type: String,
        required: true,
    }
    , url: {
        type: String,
        required: true,
    }
})
export const pdf = mongoose.model("pdf", pdfSchema)