// models/Sheet.ts
import { Schema, model, models } from "mongoose";

// Define the File schema – each file is an object with filename, code, language and timestamps.
const FileSchema = new Schema({
    filename: { type: String, required: true },
    code: { type: String, required: true }, // This string preserves tabs/newlines
    language: { type: String, default: "python" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// A sheet now contains a title, a files array (for multiple files) and optional canvas settings.
const SheetSchema = new Schema({
    playgroundId: { type: Schema.Types.ObjectId, ref: "Playground", required: true },
    title: { type: String, required: true },
    files: { type: [FileSchema], default: [] }, // Multi-file support
    canvasData: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Sheet = models.Sheet || model("Sheet", SheetSchema);
export default Sheet;
