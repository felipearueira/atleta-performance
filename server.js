import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import crypto from "node:crypto";

import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const PORT = Number(process.env.PORT || 3000);
const MCP_PATH = "/mcp";
const DAILY_TARGET = 1783;

const food = [];
const workouts = [];

/*
 * Cada sessão MCP precisa manter o mesmo McpServer e o mesmo transport.
 * O painel do Atleta Performance usa essa conexão para chamar as ferramentas.
 */
const sessions = new Map();

const dashboardHtml = readFileSync(
  "public/dashboard.html",
  "utf8"
);

const foodItem = z.object({
  id: z.string(),
  meal: z.string(),
  description: z.string(),
  calories: z.number().nullable(),
  calorieSource: z.string().nullable(),
  date: z.string(),
});

const workoutItem = z.object({
  id: z.string(),
  type: z.string(),
  date: z.string(),
  source: z.string(),
  distanceKm: z.number().nullable(),
  pace: z.string().nullable(),
  durationMinutes: z.number().nullable(),
  calories: z.number().nullable(),
  totalExpenditure: z.number().nullable(),
  heartRate: z.number().nullable(),
  notes: z.string().nullable(),
});

function dashboardState() {
  return {
    food: food.slice(),
    workouts: workouts.slice(),
    dailyTarget: DAILY_TARGET,
  };
}

function createAtletaServer() {
  const server = new McpServer(
    {
      name: "atleta-performance",
      version: "1.2.0",
    },
    {
      instructions:
        "Use o Atleta Performance para registrar alimentação e treinos e acompanhar o dashboard diário. Não invente dados que o usuário não informou. Calorias das opções alimentares são estimativas quando não vierem do usuário ou do planejamento.",
    }
  );

  const resourceUri = "ui://atleta-performance/dashboard.html";

  registerAppResource(
    server,
    "atleta-dashboard",
    resourceUri,
    {},
    async () => ({
      contents: [
        {
          uri: resourceUri,
          mimeType: RESOURCE_MIME_TYPE,
          text: dashboardHtml,
        },
      ],
    })
  );

  registerAppTool(
    server,
    "open_dashboard",
    {
      title: "Abrir dashboard",
      description:
        "Abre o dashboard do Atleta Performance com os dados atuais.",
      inputSchema: {},
      outputSchema: {
        food: z.array(foodItem),
        workouts: z.array(workoutItem),
        dailyTarget: z.number(),
      },
      _meta: {
        ui: {
          resourceUri,
        },
        "openai/widgetAccessible": true,
      },
    },
    async () => ({
      content: [
        {
          type: "text",
          text: "Dashboard do Atleta Performance aberto.",
        },
      ],
      structuredContent: dashboardState(),
    })
  );

  registerAppTool(
    server,
    "registrar_alimentacao",
    {
      title: "Registrar alimentação",
      description:
        "Registra uma refeição ou opção específica do planejamento alimentar.",
      inputSchema: {
        meal: z.string().min(1),
        description: z.string().min(1),
        calories: z.number().nullable().optional(),
        calorieSource: z.string().nullable().optional(),
        date: z.string().optional(),
      },
      outputSchema: {
        food: z.array(foodItem),
      },
      _meta: {
        ui: {
          resourceUri,
          visibility: ["model", "app"],
        },
        "openai/widgetAccessible": true,
      },
    },
    async ({
      meal,
      description,
      calories = null,
      calorieSource = null,
      date,
    }) => {
      const item = {
        id: crypto.randomUUID(),
        meal,
        description,
        calories,
        calorieSource,
        date: date || new Date().toISOString(),
      };

      const itemDate = item.date.slice(0, 10);

      for (let i = food.length - 1; i >= 0; i -= 1) {
        if (
          food[i].meal === meal &&
          food[i].date.slice(0, 10) === itemDate
        ) {
          food.splice(i, 1);
        }
      }

      food.push(item);

      return {
        content: [
          {
            type: "text",
            text: `Alimentação registrada: ${meal} — ${description}.`,
          },
        ],
        structuredContent: {
          food: food.slice(),
        },
      };
    }
  );

  registerAppTool(
    server,
    "desfazer_alimentacao",
    {
      title: "Desfazer alimentação",
      description:
        "Remove uma refeição já registrada no dashboard.",
      inputSchema: {
        id: z.string().min(1),
      },
      outputSchema: {
        food: z.array(foodItem),
      },
      _meta: {
        ui: {
          resourceUri,
          visibility: ["app"],
        },
        "openai/widgetAccessible": true,
      },
    },
    async ({ id }) => {
      const index = food.findIndex(
        (item) => item.id === id
      );

      if (index >= 0) {
        food.splice(index, 1);
      }

      return {
        content: [
          {
            type: "text",
            text: "Registro de alimentação desfeito.",
          },
        ],
        structuredContent: {
          food: food.slice(),
        },
      };
    }
  );

  registerAppTool(
    server,
    "registrar_treino",
    {
      title: "Registrar treino",
      description:
        "Registra um treino de corrida, musculação ou cardio, manualmente ou a partir de dados extraídos do Garmin.",
      inputSchema: {
        type: z.string().min(1),
        date: z.string().optional(),
        source: z.string().optional(),
        distanceKm: z.number().nullable().optional(),
        pace: z.string().nullable().optional(),
        durationMinutes: z.number().nullable().optional(),
        calories: z.number().nullable().optional(),
        totalExpenditure: z.number().nullable().optional(),
        heartRate: z.number().nullable().optional(),
        notes: z.string().nullable().optional(),
      },
      outputSchema: {
        workouts: z.array(workoutItem),
      },
      _meta: {
        ui: {
          resourceUri,
          visibility: ["model", "app"],
        },
        "openai/widgetAccessible": true,
      },
    },
    async ({
      type,
      date,
      source = "manual",
      distanceKm = null,
      pace = null,
      durationMinutes = null,
      calories = null,
      totalExpenditure = null,
      heartRate = null,
      notes = null,
    }) => {
      const workout = {
        id: crypto.randomUUID(),
        type,
        date: date || new Date().toISOString(),
        source,
        distanceKm,
        pace,
        durationMinutes,
        calories,
        totalExpenditure,
        heartRate,
        notes,
      };

      workouts.push(workout);

      return {
        content: [
          {
            type: "text",
            text: `Treino registrado: ${type}.`,
          },
        ],
        structuredContent: {
          workouts: workouts.slice(),
        },
      };
    }
  );

  registerAppTool(
    server,
    "desfazer_treino",
    {
      title: "Desfazer treino",
      description:
        "Remove um treino registrado no dashboard.",
      inputSchema: {
        id: z.string().min(1),
      },
      outputSchema: {
        workouts: z.array(workoutItem),
      },
      _meta: {
        ui: {
          resourceUri,
          visibility: ["app"],
        },
        "openai/widgetAccessible": true,
      },
    },
    async ({ id }) => {
      const index = workouts.findIndex(
        (item) => item.id === id
      );

      if (index >= 0) {
        workouts.splice(index, 1);
      }

      return {
        content: [
          {
            type: "text",
            text: "Treino desfeito.",
          },
        ],
        structuredContent: {
          workouts: workouts.slice(),
        },
      };
    }
  );

  return server;
}

async function createSession() {
  const server = createAtletaServer();

  const transport =
    new StreamableHTTPServerTransport({
      sessionIdGenerator: () =>
        crypto.randomUUID(),
      enableJsonResponse: true,
    });

  await server.connect(transport);

  const sessionId = transport.sessionId;

  if (sessionId) {
    sessions.set(sessionId, {
      server,
      transport,
    });

    transport.onclose = () => {
      sessions.delete(sessionId);

      try {
        server.close();
      } catch {}
    };
  }

  return {
    server,
    transport,
    sessionId,
  };
}

const httpServer = createServer(
  async (req, res) => {
    if (!req.url) {
      res.writeHead(400);
      res.end("Missing URL");
      return;
    }

    const url = new URL(
      req.url,
      `http://${req.headers.host || "localhost"}`
    );

    /*
     * CORS / preflight
     */
    if (
      req.method === "OPTIONS" &&
      url.pathname === MCP_PATH
    ) {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods":
          "POST, GET, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "content-type, mcp-session-id, accept",
        "Access-Control-Expose-Headers":
          "Mcp-Session-Id",
      });

      res.end();
      return;
    }

    /*
     * Health check do Render
     */
    if (
      req.method === "GET" &&
      url.pathname === "/"
    ) {
      res.writeHead(200, {
        "content-type":
          "text/plain; charset=utf-8",
      });

      res.end(
        "Atleta Performance MCP server online."
      );

      return;
    }

    /*
     * Endpoint MCP
     */
    if (
      url.pathname === MCP_PATH &&
      ["POST", "GET", "DELETE"].includes(
        req.method
      )
    ) {
      res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
      );

      res.setHeader(
        "Access-Control-Expose-Headers",
        "Mcp-Session-Id"
      );

      const sessionId =
        req.headers["mcp-session-id"];

      let session =
        sessionId
          ? sessions.get(sessionId)
          : null;

      /*
       * POST sem sessão = primeira conexão.
       * Criamos uma sessão MCP persistente.
       */
      if (!session) {
        if (
          req.method !== "POST"
        ) {
          res.writeHead(400, {
            "content-type":
              "application/json",
          });

          res.end(
            JSON.stringify({
              jsonrpc: "2.0",
              error: {
                code: -32000,
                message:
                  "Sessão MCP não encontrada.",
              },
              id: null,
            })
          );

          return;
        }

        try {
          session = await createSession();
        } catch (error) {
          console.error(
            "Erro ao criar sessão MCP:",
            error
          );

          if (!res.headersSent) {
            res.writeHead(500, {
              "content-type":
                "application/json",
            });

            res.end(
              JSON.stringify({
                jsonrpc: "2.0",
                error: {
                  code: -32603,
                  message:
                    "Não foi possível iniciar a sessão MCP.",
                },
                id: null,
              })
            );
          }

          return;
        }
      }

      try {
        await session.transport.handleRequest(
          req,
          res
        );
      } catch (error) {
        console.error(
          "Erro no MCP:",
          error
        );

        if (!res.headersSent) {
          res.writeHead(500, {
            "content-type":
              "application/json",
          });

          res.end(
            JSON.stringify({
              jsonrpc: "2.0",
              error: {
                code: -32603,
                message:
                  "Internal server error",
              },
              id: null,
            })
          );
        }
      }

      return;
    }

    res.writeHead(404);
    res.end("Not Found");
  }
);

httpServer.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `Atleta Performance MCP rodando na porta ${PORT}`
    );
  }
);
