import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { startOfDay, endOfDay } from "date-fns";
const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

app.use(express.json());

app.use((req, res, next) => {
  console.log(`➡️  ${req.method} ${req.url}`);
  console.log("🧾 Body:", req.body);
  console.log("🧾 Query:", req.query);

  // Capture response data
  const originalJson = res.json;
  res.json = function (data) {
    console.log("✅ Response:", data);
    return originalJson.call(this, data);
  };

  next();
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/api/income", async (req, res) => {
  try {
    const { category, date, value, description, people, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const income = await prisma.income.create({
      data: {
        category,
        date: new Date(date),
        value: parseFloat(value),
        description,
        people,
        userId: parseInt(userId, 10),
      },
    });

    res.status(201).json(income);
  } catch (error) {
    console.error("Prisma save error:", error);
    res.status(500).json({ message: "Database error" });
  }
});

app.get("/api/income/summary", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const totalIncome = await prisma.income.aggregate({
      _sum: { value: true },
      where: { userId: parseInt(userId, 10) },
    });

    const byCategory = await prisma.income.groupBy({
      by: ["category"],
      _sum: { value: true },
      where: { userId: parseInt(userId, 10) },
    });

    const allIncomes = await prisma.income.findMany({
      where: { userId: parseInt(userId, 10) },
      orderBy: { date: "desc" },
    });

    res.json({
      totalIncome: totalIncome._sum.value || 0,
      bar: byCategory.map((item) => ({
        category: item.category,
        amount: item._sum.value,
      })),
      pie: byCategory.map((item) => ({
        name: item.category,
        value: item._sum.value,
      })),
      spends: allIncomes,
      infoText: "Your Spender 20% more of last month", // Placeholder
    });
  } catch (error) {
    console.error("Summary error:", error);
    res.status(500).json({ message: "Database error" });
  }
});

app.get("/dashboard", async (req, res) => {
  try {
    const { userId } = req.query;

    const parsedUserId = parseInt(userId, 10);

    if (!userId || isNaN(parsedUserId)) {
      return res
        .status(400)
        .json({ message: "Valid numeric userId is required" });
    }

    if (isNaN(parsedUserId)) {
      return res.status(400).json({ message: "userId must be a valid number" });
    }

    const totalIncome = await prisma.income.aggregate({
      _sum: { value: true },
      where: { userId: parseInt(userId, 10) },
    });

    const totalSpends = await prisma.spend.aggregate({
      _sum: { value: true },
      where: { userId: parseInt(userId, 10) },
    });

    const byCategory = await prisma.income.groupBy({
      by: ["category"],
      _sum: { value: true },
      where: { userId: parseInt(userId, 10) },
    });

    const allIncomes = await prisma.income.findMany({
      where: { userId: parseInt(userId, 10) },
      orderBy: { date: "desc" },
    });

    const name = await prisma.user.findUnique({
      where: { id: parseInt(userId, 10) },
      select: { name: true },
    });

    const balance =
      (totalIncome._sum.value || 0) - (totalSpends._sum.value || 0);

    // Get today’s date boundaries
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    // 🧾 Query total spent today
    const dailySpends = await prisma.spend.findMany({
      where: {
        userId: parsedUserId,
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });
    const dailySpendTotal = dailySpends.reduce(
      (sum, item) => sum + item.value,
      0,
    );

    // 🧾 Query total income today
    const dailyIncome = await prisma.income.findMany({
      where: {
        userId: parsedUserId,
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });
    const dailyIncomeTotal = dailyIncome.reduce(
      (sum, item) => sum + item.value,
      0,
    );

    const dailyData = await prisma.$queryRaw`
      SELECT
        DATE("date") AS "date",
        SUM(CASE WHEN "type" = 'income' THEN value ELSE 0 END) AS income,
        SUM(CASE WHEN "type" = 'spend' THEN value ELSE 0 END) AS spend
      FROM (
        SELECT date, value, 'income' AS type FROM "Income" WHERE "userId" = ${parsedUserId}
        UNION ALL
        SELECT date, value, 'spend' AS type FROM "Spend" WHERE "userId" = ${parsedUserId}
      ) AS combined
      GROUP BY DATE("date")
      ORDER BY DATE("date") ASC;
    `;

    res.json({
      nameUser: name?.name || "User",
      totalIncome: totalIncome._sum.value || 0,
      totalSpends: totalSpends._sum.value || 0,
      dailySpends: dailySpendTotal,
      dailyIncome: dailyIncomeTotal,
      balance: balance,
      dailyData: dailyData,
      bar: byCategory.map((item) => ({
        category: item.category,
        amount: item._sum.value,
      })),
      pie: byCategory.map((item) => ({
        name: item.category,
        value: item._sum.value,
      })),
      spends: allIncomes,
      infoText: "Your Spender 20% more of last month",
    });
  } catch (error) {
    console.error("Summary error:", error);
    res.status(500).json({ message: "Database error" });
  }
});

app.listen(3000, () => {
  console.log("Express server initialized");
});
