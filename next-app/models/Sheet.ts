// models/Sheet.ts
import { Schema, model, models } from "mongoose";

const SheetSchema = new Schema({
    playgroundId: { type: Schema.Types.ObjectId, ref: "Playground", required: true },
    title: { type: String, required: true },
    code: { type: String, required: true },
    canvasData: { type: Object, default: {} },
    language: { type: String, default: "js" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Sheet = models.Sheet || model("Sheet", SheetSchema);
export default Sheet;
