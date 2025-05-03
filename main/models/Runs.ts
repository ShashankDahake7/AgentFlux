// models/Run.ts
import { Schema, model, models } from "mongoose";

const RunSchema = new Schema({
    sheetId: { type: Schema.Types.ObjectId, ref: "Sheet", required: true },
    timestamp: { type: Date, default: Date.now },
    output: { type: String, required: true },
    timings: { type: Schema.Types.Mixed, required: true },
});

const Run = models.Run || model("Run", RunSchema);
export default Run;