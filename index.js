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
        date: new new Date()(),
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

app.post("/api/spends/edit/:id", async (req, res) => {
  try {
    const incomeId = parseInt(req.params.id, 10);
    const { category, date, value, description, people, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const updatedIncome = await prisma.income.update({
      where: { id: incomeId },
      data: {
        category,
        date: new Date(date),
        value: parseFloat(value),
        statusSpend,
        description,
        people,
        userId: parseInt(userId, 10),
      },
    });

    res.status(201).json(updatedIncome);
  } catch (error) {
    console.error("Prisma update error:", error);

    if (error.code === "P2025") {
      // Record not found
      return res.status(404).json({ message: "Transaction not found" });
    }

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

app.post("/api/spends", async (req, res) => {
  try {
    const { category, date, value, statusSpend, description, people, userId } =
      req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const spend = await prisma.spend.create({
      data: {
        category,
        date: new Date(date),
        value: parseFloat(value),
        statusSpend,
        description,
        people,
        userId: parseInt(userId, 10),
      },
    });

    res.status(201).json(spend);
  } catch (error) {
    console.error("Prisma save error:", error);
    res.status(500).json({ message: "Database error" });
  }
});

app.put("/api/spends/edit/:id", async (req, res) => {
  try {
    const spendId = parseInt(req.params.id, 10);
    const { category, date, value, statusSpend, description, people, userId } =
      req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const updatedSpend = await prisma.spend.update({
      where: { id: spendId },
      data: {
        category,
        date: new Date(date),
        value: parseFloat(value),
        statusSpend,
        description,
        people,
        userId: parseInt(userId, 10),
      },
    });

    res.status(200).json(updatedSpend);
  } catch (error) {
    console.error("Prisma update error:", error);

    if (error.code === "P2025") {
      // Record not found
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(500).json({ message: "Database error" });
  }
});

app.get("/api/get/spend/:id", async (req, res) => {
  const id = Number(req.params.id);
  const userId = Number(req.query.userId);

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  try {
    const income = await prisma.spend.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!income) {
      return res
        .status(404)
        .json({ message: "Spend not found or access denied" });
    }

    res.status(200).json(income);
  } catch (error) {
    console.error("Error fetching spend:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/get/income/:id", async (req, res) => {
  const id = Number(req.params.id);
  const userId = Number(req.query.userId);

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  try {
    const income = await prisma.income.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!income) {
      return res
        .status(404)
        .json({ message: "Income not found or access denied" });
    }

    res.status(200).json(income);
  } catch (error) {
    console.error("Error fetching income:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/spends/summary", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const totalSpend = await prisma.spend.aggregate({
      _sum: { value: true },
      where: { userId: parseInt(userId, 10) },
    });

    const byCategory = await prisma.spend.groupBy({
      by: ["category"],
      _sum: { value: true },
      where: { userId: parseInt(userId, 10) },
    });

    const allSpends = await prisma.spend.findMany({
      where: { userId: parseInt(userId, 10) },
      orderBy: { date: "desc" },
    });

    res.json({
      totalSpend: totalSpend._sum.value || 0,
      bar: byCategory.map((item) => ({
        category: item.category,
        amount: item._sum.value,
      })),
      pie: byCategory.map((item) => ({
        name: item.category,
        value: item._sum.value,
      })),
      spends: allSpends,
      infoText: "Your Spender 20% more of last month",
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

app.get("/transactions", async (req, res) => {
  try {
    const userId = Number(req.query.userId);

    if (!userId) {
      return res.status(400).json({ message: "Missing userId" });
    }

    // Fetch last 5 incomes
    const incomesTransactions = await prisma.income.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 5,
      select: {
        id: true,
        description: true,
        value: true,
        date: true,
      },
    });

    // Fetch last 5 spends
    const spendsTransactions = await prisma.spend.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 5,
      select: {
        id: true,
        description: true,
        value: true,
        date: true,
      },
    });

    // Add `type` field manually if not in DB
    const formattedIncomes = incomesTransactions.map((i) => ({
      ...i,
      type: "income",
    }));
    const formattedSpends = spendsTransactions.map((s) => ({
      ...s,
      type: "spend",
    }));

    // Merge and sort by date descending
    const dashboardTransactions = [
      ...formattedIncomes,
      ...formattedSpends,
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      transactions: dashboardTransactions,
      incomes: formattedIncomes,
      spends: formattedSpends,
    });
  } catch (error) {
    console.error("transactions error:", error);
    res.status(500).json({ message: "Database error" });
  }
});

app.delete("/api/incomes/delete/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(400).json({ message: "Missing transaction ID" });

  try {
    await prisma.income.delete({ where: { id: Number(id) } });
    return res.status(200).json({ message: `Income ${id} deleted` });
  } catch (err) {
    console.error("Delete income error:", err);
    return res.status(404).json({ message: "Transaction not found" });
  }
});

app.delete("/api/spends/delete/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(400).json({ message: "Missing transaction ID" });

  try {
    await prisma.spend.delete({ where: { id: Number(id) } });
    return res.status(200).json({ message: `Spend ${id} deleted` });
  } catch (err) {
    console.error("Delete spend error:", err);
    return res.status(404).json({ message: "Transaction not found" });
  }
});

app.post("/api/accounts", async (req, res) => {
  try {
    const { name, type, balance, userId } = req.body;

    if (!name || !type || !userId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const account = await prisma.account.create({
      data: {
        name,
        type,
        balance: parseFloat(balance) || 0,
        userId: parseInt(userId, 10),
      },
    });

    res.status(201).json(account);
  } catch (error) {
    console.error("Error creating account:", error);
    res.status(500).json({ message: "Database error" });
  }
});

app.post("/api/categories", async (req, res) => {
  try {
    const { name, subcategories, userId } = req.body;

    if (!name || !userId) {
      return res
        .status(400)
        .json({ message: "Category name and userId are required" });
    }

    // Create the subcategory (expects `subcategories` to be a string)
    const subcategory = await prisma.subcategory.create({
      data: { name: subcategories },
    });

    // Create the category and link the subcategory
    const category = await prisma.category.create({
      data: {
        name,
        userId: parseInt(userId, 10),
        subcategoryId: subcategory.id,
      },
      include: {
        subcategory: true,
      },
    });

    res.status(201).json(category);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: "Database error" });
  }
});

app.listen(3000, () => {
  console.log("Express server initialized");
});
