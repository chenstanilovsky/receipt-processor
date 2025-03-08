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
      res.status(400).json({ description: "The receipt is invalid." });
      return;
    }

    const receiptData: ReceiptData = req.body;
    const receiptId = handleProcessReceipt(receiptData, receiptsDb);
    res.status(200).json({ id: receiptId });
  }
);

app.get("/receipts/:id/points", (req: Request, res: Response): void => {
  const { id } = req.params;
  const points = handleGetPoints(id, receiptsDb);

  if (points === null) {
    res.status(404).json({ error: "No receipt found for that ID." });
    return;
  }

  res.status(200).json({ points });
});

app.listen(3000, () => {
  console.log(`Server running on port 3000`);
});
