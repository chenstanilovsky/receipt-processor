import express, { Request, Response } from "express";
import { validationResult } from "express-validator";
import {
  processReceiptSchema,
  ReceiptData,
  handleProcessReceipt,
} from "./processReceipt.js";
import { handleGetPoints } from "./getPoints.js";

const app = express();
app.use(express.json());

const receiptsDb: Record<string, { points: number }> = {};

app.post(
  "/receipts/process",
  processReceiptSchema,
  (req: Request, res: Response): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const receiptData: ReceiptData = req.body;
      const receiptId = handleProcessReceipt(receiptData, receiptsDb);
      res.status(200).json({ id: receiptId });
    } catch (error) {
      res.status(500).json({ error: "Failed to process receipt" });
    }
  }
);

app.get("/receipts/:id/points", (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const points = handleGetPoints(id, receiptsDb);

    if (points === null) {
      res.status(404).json({ error: "Receipt not found" });
      return;
    }

    res.status(200).json({ points });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve points" });
  }
});

app.listen(3000, () => {
  console.log(`Server running on port 3000`);
});
