// models/Playground.ts
import { Schema, model, models } from "mongoose";

const PlaygroundSchema = new Schema({
    userId: { type: String, required: true }, // Firebase UID
    name: { type: String, required: true },
    description: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Playground = models.Playground || model("Playground", PlaygroundSchema);
export default Playground;
