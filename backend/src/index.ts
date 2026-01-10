import express, { Request, Response, NextFunction } from "express";
import { requireAuth } from "./middleware/auth";
import authRouter from "./routes/auth";
import profileRouter from "./routes/profiles";
import adminRouter from "./routes/admin";
import bookingRouter from "./routes/bookings";
import availabilityRouter from "./routes/availability";
import timeSlotsRouter from "./routes/timeSlots";
import cors from "cors";
import { prisma } from "../prisma/client";
import z from "zod";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

// Enable CORS for your React frontend
app.use(
  cors({
    origin: ["http://localhost:3001", "http://localhost:3000"], // Add your frontend URL
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use("/auth", authRouter);
app.use("/profiles", profileRouter);
app.use("/admin", adminRouter);
app.use("/bookings", bookingRouter);
app.use("/availability", availabilityRouter);
app.use("/time-slots", timeSlotsRouter);

app.get("/health", requireAuth, (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.post(
  "/hello",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const text: string = req.body?.text ?? "Hello, World!!";
      const msg = await prisma.message.create({ data: { text } });
      res.status(201).json(msg);
    } catch (err) {
      next(err);
    }
  }
);

app.get("/hello", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const latest = await prisma.message.findFirst({
      orderBy: { createdAt: "desc" },
    });
    res.json({ latest });
  } catch (err) {
    next(err);
  }
});

app.use(errorHandler);

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
