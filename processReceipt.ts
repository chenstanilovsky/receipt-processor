import crypto from "crypto";
import { checkSchema } from "express-validator";

export interface ReceiptItem {
  price: string;
  shortDescription: string;
}

export interface ReceiptData {
  retailer: string;
  purchaseDate: string;
  purchaseTime: string;
  items: ReceiptItem[];
  total: number;
}

export const processReceiptSchema = checkSchema(
  {
    retailer: { isString: true, notEmpty: true, matches: {options: /^[\w\s\-&]+$/}},
    purchaseDate: { isString: true, notEmpty: true, isDate: true },
    purchaseTime: { isString: true, notEmpty: true, isTime: true },
    items: {
      isArray: true,
      custom: {
        options: (value) => {
          return value.length > 0 && value.every((item: { price: string, shortDescription: string }) => {
            let priceRegex = /^\d+\.\d{2}$/;
            let shortDescriptionRegex = /^[\w\s\-]+$/;
            return item.price && item.shortDescription && item.price.length !== 0 && item.shortDescription.length !== 0 && priceRegex.test(item.price) && shortDescriptionRegex.test(item.shortDescription);
          });
        },
      },
    },
    total: { isString: true, notEmpty: true, isNumeric: true, matches: {options: /^\d+\.\d{2}$/} },
  },
  ["body"]
);

export function calculatePoints(receipt: ReceiptData): number {
  let points = 0;

  points += receipt.retailer.replace(/[^a-zA-Z0-9]/g, "").length;
  points += receipt.total % 1 === 0 ? 50 : 0;
  points += receipt.total % 0.25 === 0 ? 25 : 0;
  points += Math.floor(receipt.items.length / 2) * 5;
  points += receipt.items.reduce((acc, item) => {
    return (
      acc +
      (item.shortDescription.trim().length % 3 === 0
        ? Math.ceil(Number(item.price) * 0.2)
        : 0)
    );
  }, 0);
  points += new Date(receipt.purchaseDate).getUTCDate() % 2 == 1 ? 6 : 0;

  const purchaseTime = receipt.purchaseTime.split(":");
  const purchaseHour = parseInt(purchaseTime[0]);
  const purchaseMinute = parseInt(purchaseTime[1]);

  if (purchaseHour === 14 && purchaseMinute > 0) {
    points += 10;
  } else if (purchaseHour === 15) {
    points += 10;
  }

  return points;
}

export const handleProcessReceipt = (
  receiptData: ReceiptData,
  receiptsDb: Record<string, { points: number }>
): string => {
  let receiptId = crypto.randomUUID();
  while(receiptsDb[receiptId] !== undefined) {
    receiptId = crypto.randomUUID();
  }

  const parsedReceiptData = {
    retailer: receiptData.retailer,
    purchaseDate: receiptData.purchaseDate,
    purchaseTime: receiptData.purchaseTime,
    items: receiptData.items,
    total: Number(receiptData.total),
  };

  const points = calculatePoints(parsedReceiptData);
  receiptsDb[receiptId] = { points };

  return receiptId;
};
