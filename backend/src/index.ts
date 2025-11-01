
import express, { Request, Response, NextFunction } from "express";
import { requireAuth } from "./middleware/auth";
import authRouter from "./routes/auth";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use("/auth", authRouter);

app.get("/health", requireAuth, (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.post("/hello", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const text: string = req.body?.text ?? "Hello, World!!";
    const msg = await prisma.message.create({ data: { text } });
    res.status(201).json(msg);
  } catch (err) {
    next(err);
  }
  
});

app.get("/hello", async(req: Request, res: Response, next: NextFunction) => {
  try {
    const latest = await prisma.message.findFirst({
      orderBy: { createdAt: "desc"},
    });
    res.json({ latest });
  } catch (err) {
    next(err);
  }
});

// Basic error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
