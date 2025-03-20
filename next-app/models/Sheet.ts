import { Schema, model, models } from "mongoose";

const FileSchema = new Schema({
    filename: { type: String, required: true },
    code: { type: String, required: true },
    language: { type: String, default: "python" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const SheetSchema = new Schema({
    playgroundId: { type: Schema.Types.ObjectId, ref: "Playground", required: true },
    title: { type: String, required: true },
    files: { type: [FileSchema], default: [] },
    canvasData: { type: Object, default: {} },
    graphData: { type: Object, default: null }, // <-- NEW FIELD FOR GRAPH DATA
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const Sheet = models.Sheet || model("Sheet", SheetSchema);
export default Sheet;
