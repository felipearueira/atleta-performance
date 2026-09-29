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

/*
 * ============================================================
 * ESTADO DO APLICATIVO
 * ============================================================
 */

const food = [];
const workouts = [];

/*
 * Cada conexão MCP possui seu próprio transport.
 * Isso permite que o cliente mantenha uma sessão estável.
 */

const sessions = new Map();

/*
 * ============================================================
 * DASHBOARD
 * ============================================================
 */

const dashboardHtml = readFileSync(
  "public/dashboard.html",
  "utf8"
);

/*
 * ============================================================
 * SCHEMAS
 * ============================================================
 */

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

/*
 * ============================================================
 * ESTADO DO DASHBOARD
 * ============================================================
 */

function getDashboardState() {
  return {
    food: [...food],
    workouts: [...workouts],
    dailyTarget: DAILY_TARGET,
  };
}

/*
 * ============================================================
 * CRIAÇÃO DO SERVIDOR MCP
 * ============================================================
 */

function createAtletaServer() {
  const server = new McpServer(
    {
      name: "atleta-performance",
      version: "2.0.0",
    },
    {
      instructions:
        "Você é o servidor do Atleta Performance. Registre alimentação e treinos informados pelo usuário. Não invente dados. Calorias que não vierem do usuário ou do planejamento devem ser tratadas como estimativas.",
    }
  );

  /*
   * ----------------------------------------------------------
   * RECURSO VISUAL
   * ----------------------------------------------------------
   */

  const resourceUri =
    "ui://atleta-performance/dashboard.html";

  registerAppResource(
    server,
    "atleta-dashboard",
    resourceUri,
    {},
    async () => {
      return {
        contents: [
          {
            uri: resourceUri,
            mimeType: RESOURCE_MIME_TYPE,
            text: dashboardHtml,
          },
        ],
      };
    }
  );

  /*
   * ----------------------------------------------------------
   * ABRIR DASHBOARD
   * ----------------------------------------------------------
   */

  registerAppTool(
    server,
    "open_dashboard",
    {
      title: "Abrir dashboard",
      description:
        "Abre o dashboard do Atleta Performance.",
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
      },
    },
    async () => {
      return {
        content: [
          {
            type: "text",
            text: "Dashboard do Atleta Performance aberto.",
          },
        ],
        structuredContent:
          getDashboardState(),
      };
    }
  );

  /*
   * ----------------------------------------------------------
   * REGISTRAR ALIMENTAÇÃO
   * ----------------------------------------------------------
   */

  registerAppTool(
    server,
    "registrar_alimentacao",
    {
      title: "Registrar alimentação",

      description:
        "Registra uma refeição do planejamento alimentar.",

      inputSchema: {
        meal: z.string().min(1),
        description: z.string().min(1),
        calories: z
          .number()
          .nullable()
          .optional(),

        calorieSource: z
          .string()
          .nullable()
          .optional(),

        date: z
          .string()
          .optional(),
      },

      outputSchema: {
        food: z.array(foodItem),
      },

      _meta: {
        ui: {
          resourceUri,
          visibility: ["model", "app"],
        },
      },
    },

    async ({
      meal,
      description,
      calories = null,
      calorieSource = null,
      date,
    }) => {

      const itemDate =
        (date || new Date().toISOString())
          .slice(0, 10);

      /*
       * Remove o registro anterior da mesma refeição
       * no mesmo dia.
       */

      for (let i = food.length - 1; i >= 0; i--) {
        if (
          food[i].meal === meal &&
          food[i].date.slice(0, 10) === itemDate
        ) {
          food.splice(i, 1);
        }
      }

      const item = {
        id: crypto.randomUUID(),
        meal,
        description,
        calories,
        calorieSource,
        date: date || new Date().toISOString(),
      };

      food.push(item);

      return {
        content: [
          {
            type: "text",
            text:
              `Alimentação registrada: ${meal}.`,
          },
        ],

        structuredContent: {
          food: [...food],
        },
      };
    }
  );

  /*
   * ----------------------------------------------------------
   * DESFAZER ALIMENTAÇÃO
   * ----------------------------------------------------------
   */

  registerAppTool(
    server,
    "desfazer_alimentacao",
    {
      title: "Desfazer alimentação",

      description:
        "Remove uma refeição registrada.",

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
      },
    },

    async ({ id }) => {

      const index =
        food.findIndex(
          item => item.id === id
        );

      if (index !== -1) {
        food.splice(index, 1);
      }

      return {
        content: [
          {
            type: "text",
            text:
              "Registro de alimentação removido.",
          },
        ],

        structuredContent: {
          food: [...food],
        },
      };
    }
  );

  /*
   * ----------------------------------------------------------
   * REGISTRAR TREINO
   * ----------------------------------------------------------
   */

  registerAppTool(
    server,
    "registrar_treino",
    {
      title: "Registrar treino",

      description:
        "Registra corrida, musculação ou cardio.",

      inputSchema: {

        type: z
          .string()
          .min(1),

        date: z
          .string()
          .optional(),

        source: z
          .string()
          .optional(),

        distanceKm: z
          .number()
          .nullable()
          .optional(),

        pace: z
          .string()
          .nullable()
          .optional(),

        durationMinutes: z
          .number()
          .nullable()
          .optional(),

        calories: z
          .number()
          .nullable()
          .optional(),

        totalExpenditure: z
          .number()
          .nullable()
          .optional(),

        heartRate: z
          .number()
          .nullable()
          .optional(),

        notes: z
          .string()
          .nullable()
          .optional(),
      },

      outputSchema: {
        workouts:
          z.array(workoutItem),
      },

      _meta: {
        ui: {
          resourceUri,
          visibility: ["model", "app"],
        },
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

        date:
          date ||
          new Date().toISOString(),

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
            text:
              `Treino registrado: ${type}.`,
          },
        ],

        structuredContent: {
          workouts: [...workouts],
        },
      };
    }
  );

  /*
   * ----------------------------------------------------------
   * DESFAZER TREINO
   * ----------------------------------------------------------
   */

  registerAppTool(
    server,
    "desfazer_treino",
    {
      title: "Desfazer treino",

      description:
        "Remove um treino registrado.",

      inputSchema: {
        id: z.string().min(1),
      },

      outputSchema: {
        workouts:
          z.array(workoutItem),
      },

      _meta: {
        ui: {
          resourceUri,
          visibility: ["app"],
        },
      },
    },

    async ({ id }) => {

      const index =
        workouts.findIndex(
          item => item.id === id
        );

      if (index !== -1) {
        workouts.splice(index, 1);
      }

      return {

        content: [
          {
            type: "text",
            text:
              "Registro de treino removido.",
          },
        ],

        structuredContent: {
          workouts: [...workouts],
        },
      };
    }
  );

  return server;
}

/*
 * ============================================================
 * HEADERS HTTP
 * ============================================================
 */

function setCorsHeaders(res) {

  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, DELETE, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept, Mcp-Session-Id"
  );

  res.setHeader(
    "Access-Control-Expose-Headers",
    "Mcp-Session-Id"
  );
}

/*
 * ============================================================
 * SERVIDOR HTTP
 * ============================================================
 */

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
     * --------------------------------------------------------
     * CORS PREFLIGHT
     * --------------------------------------------------------
     */

    if (
      req.method === "OPTIONS" &&
      url.pathname === MCP_PATH
    ) {

      setCorsHeaders(res);

      res.writeHead(204);
      res.end();

      return;
    }

    /*
     * --------------------------------------------------------
     * TESTE DO SERVIDOR
     * --------------------------------------------------------
     */

    if (
      req.method === "GET" &&
      url.pathname === "/"
    ) {

      res.writeHead(200, {
        "Content-Type":
          "text/plain; charset=utf-8",
      });

      res.end(
        "Atleta Performance MCP server online."
      );

      return;
    }

    /*
     * --------------------------------------------------------
     * MCP
     * --------------------------------------------------------
     */

    if (url.pathname === MCP_PATH) {

      setCorsHeaders(res);

      /*
       * Recupera a sessão enviada pelo cliente.
       */

      const sessionId =
        req.headers["mcp-session-id"];

      let session =
        sessionId
          ? sessions.get(sessionId)
          : null;

      /*
       * ------------------------------------------------------
       * NOVA SESSÃO
       * ------------------------------------------------------
       */

      if (!session) {

        const server =
          createAtletaServer();

        const transport =
          new StreamableHTTPServerTransport(
            {
              sessionIdGenerator:
                () =>
                  crypto.randomUUID(),

              enableJsonResponse:
                true,
            }
          );

        session = {
          server,
          transport,
        };

        /*
         * O transporte gera o ID da sessão
         * durante a primeira conexão.
         */

        transport.onclose = () => {

          const id =
            transport.sessionId;

          if (id) {
            sessions.delete(id);
          }

          server.close();
        };

        /*
         * Conecta o servidor MCP ao transporte.
         */

        await server.connect(
          transport
        );

        /*
         * Se o transporte já possui ID,
         * guarda a sessão.
         */

        if (transport.sessionId) {

          sessions.set(
            transport.sessionId,
            session
          );
        }
      }

      /*
       * Processa a requisição MCP.
       */

      try {

        await session.transport.handleRequest(
          req,
          res
        );

        /*
         * Depois da primeira requisição,
         * o transporte pode ter criado
         * o session ID.
         */

        if (
          session.transport.sessionId &&
          !sessions.has(
            session.transport.sessionId
          )
        ) {

          sessions.set(
            session.transport.sessionId,
            session
          );
        }

      } catch (error) {

        console.error(
          "Erro no transporte MCP:",
          error
        );

        if (!res.headersSent) {

          res.writeHead(500, {
            "Content-Type":
              "text/plain; charset=utf-8",
          });

          res.end(
            "Internal MCP server error."
          );
        }
      }

      return;
    }

    /*
     * --------------------------------------------------------
     * 404
     * --------------------------------------------------------
     */

    res.writeHead(404, {
      "Content-Type":
        "text/plain; charset=utf-8",
    });

    res.end("Not Found");
  }
);

/*
 * ============================================================
 * INICIALIZAÇÃO
 * ============================================================
 */

httpServer.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `Atleta Performance MCP rodando na porta ${PORT}`
    );

    console.log(
      `MCP endpoint: ${MCP_PATH}`
    );
  }
);
