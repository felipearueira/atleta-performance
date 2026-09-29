import express from "express";
import { randomUUID } from "crypto";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

/*
 * Estado inicial do Atleta Performance.
 * Nesta primeira versão, os dados ficam na memória do servidor.
 * Depois vamos conectar um armazenamento permanente.
 */
const state = {
  food: [],
  workouts: [],
  dailyTarget: 1783
};

/*
 * Página inicial simples para verificar se o servidor está funcionando.
 */
app.get("/", (req, res) => {
  res.json({
    name: "Atleta Performance",
    status: "online",
    message: "Servidor MCP do Atleta Performance está funcionando."
  });
});

/*
 * Endpoint de saúde usado pelo serviço de hospedagem.
 */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/*
 * Retorna os dados atuais do atleta.
 */
app.get("/api/dashboard", (req, res) => {
  res.json({
    dailyTarget: state.dailyTarget,
    food: state.food,
    workouts: state.workouts
  });
});

/*
 * Registra uma alimentação.
 */
app.post("/api/food", (req, res) => {
  const { meal, description, calories } = req.body;

  if (!meal || !description) {
    return res.status(400).json({
      error: "Informe a refeição e a descrição do alimento."
    });
  }

  const item = {
    id: randomUUID(),
    date: new Date().toISOString(),
    meal,
    description,
    calories: calories ?? null
  };

  state.food.push(item);

  res.status(201).json(item);
});

/*
 * Registra um treino.
 */
app.post("/api/workouts", (req, res) => {
  const {
    type,
    date,
    distanceKm,
    pace,
    durationMinutes,
    calories,
    totalExpenditure
  } = req.body;

  if (!type) {
    return res.status(400).json({
      error: "Informe o tipo do treino."
    });
  }

  const workout = {
    id: randomUUID(),
    date: date || new Date().toISOString(),
    type,
    distanceKm: distanceKm ?? null,
    pace: pace ?? null,
    durationMinutes: durationMinutes ?? null,
    calories: calories ?? null,
    totalExpenditure: totalExpenditure ?? null
  };

  state.workouts.push(workout);

  res.status(201).json(workout);
});

/*
 * Endpoint MCP.
 *
 * Por enquanto deixamos a estrutura básica pronta.
 * Na próxima etapa vamos conectar este endpoint
 * ao protocolo MCP e à interface do dashboard.
 */
app.post("/mcp", (req, res) => {
  res.status(200).json({
    jsonrpc: "2.0",
    id: req.body?.id ?? null,
    result: {
      status: "Atleta Performance MCP endpoint ativo"
    }
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Atleta Performance rodando na porta ${PORT}`);
});
