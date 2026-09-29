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

let food = [];
let workouts = [];

/*
 * O dashboard será colocado neste arquivo:
 * public/dashboard.html
 */
const dashboardHtml = readFileSync(
  "public/dashboard.html",
  "utf8"
);

function createAtletaServer() {
  const server = new McpServer(
    {
      name: "atleta-performance",
      version: "1.0.0",
    },
    {
      instructions:
        "Use o Atleta Performance para registrar alimentação e treinos e acompanhar o dashboard diário. Não invente dados que o usuário não informou.",
    }
  );

  /*
   * Registra o dashboard como uma interface visual
   * que pode ser exibida dentro do ChatGPT.
   */
  registerAppResource(
    server,
    "atleta-dashboard",
    "ui://atleta-performance/dashboard.html",
    {},
    async () => ({
      contents: [
        {
          uri: "ui://atleta-performance/dashboard.html",
          mimeType: RESOURCE_MIME_TYPE,
          text: dashboardHtml,
        },
      ],
    })
  );

  /*
   * Ferramenta para abrir o dashboard.
   */
  registerAppTool(
    server,
    "open_dashboard",
    {
      title: "Abrir dashboard",
      description:
        "Abre o dashboard do Atleta Performance com os dados atuais.",
      inputSchema: {},
      outputSchema: {
        food: z.array(
          z.object({
            id: z.string(),
            meal: z.string(),
            description: z.string(),
            calories: z.number().nullable(),
          })
        ),
        workouts: z.array(
          z.object({
            id: z.string(),
            type: z.string(),
            date: z.string(),
            distanceKm: z.number().nullable(),
            pace: z.string().nullable(),
            durationMinutes: z.number().nullable(),
            calories: z.number().nullable(),
            totalExpenditure: z.number().nullable(),
          })
        ),
        dailyTarget: z.number(),
      },
      _meta: {
        ui: {
          resourceUri: "ui://atleta-performance/dashboard.html",
        },
      },
    },
    async () => ({
      content: [
        {
          type: "text",
          text: "Dashboard do Atleta Performance aberto.",
        },
      ],
      structuredContent: {
        food,
        workouts,
        dailyTarget: 1783,
      },
    })
  );

  /*
   * Ferramenta para registrar alimentação.
   */
  registerAppTool(
    server,
    "registrar_alimentacao",
    {
      title: "Registrar alimentação",
      description:
        "Registra uma refeição ou alimento informado pelo usuário.",
      inputSchema: {
        meal: z.string().min(1),
        description: z.string().min(1),
        calories: z.number().nullable().optional(),
      },
      outputSchema: {
        food: z.array(
          z.object({
            id: z.string(),
            meal: z.string(),
            description: z.string(),
            calories: z.number().nullable(),
          })
        ),
      },
      _meta: {
        ui: {
          resourceUri: "ui://atleta-performance/dashboard.html",
        },
      },
    },
    async ({ meal, description, calories = null }) => {
      const item = {
        id: crypto.randomUUID(),
        meal,
        description,
        calories,
      };

      food.push(item);

      return {
        content: [
          {
            type: "text",
            text: `Alimentação registrada: ${meal}.`,
          },
        ],
        structuredContent: {
          food,
        },
      };
    }
  );

  /*
   * Ferramenta para registrar treinos.
   */
  registerAppTool(
    server,
    "registrar_treino",
    {
      title: "Registrar treino",
      description:
        "Registra um treino de corrida, musculação ou cardio.",
      inputSchema: {
        type: z.string().min(1),
        date: z.string().optional(),
        distanceKm: z.number().nullable().optional(),
        pace: z.string().nullable().optional(),
        durationMinutes: z.number().nullable().optional(),
        calories: z.number().nullable().optional(),
        totalExpenditure: z.number().nullable().optional(),
      },
      outputSchema: {
        workouts: z.array(
          z.object({
            id: z.string(),
            type: z.string(),
            date: z.string(),
            distanceKm: z.number().nullable(),
            pace: z.string().nullable(),
            durationMinutes: z.number().nullable(),
            calories: z.number().nullable(),
            totalExpenditure: z.number().nullable(),
          })
        ),
      },
      _meta: {
        ui: {
          resourceUri: "ui://atleta-performance/dashboard.html",
        },
      },
    },
    async ({
      type,
      date,
      distanceKm = null,
      pace = null,
      durationMinutes = null,
      calories = null,
      totalExpenditure = null,
    }) => {
      const workout = {
        id: crypto.randomUUID(),
        type,
        date: date || new Date().toISOString(),
        distanceKm,
        pace,
        durationMinutes,
        calories,
        totalExpenditure,
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
          workouts,
        },
      };
    }
  );

  return server;
}

/*
 * Servidor HTTP.
 */
const httpServer = createServer(async (req, res) => {
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
   * CORS.
   */
  if (req.method === "OPTIONS" && url.pathname === MCP_PATH) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods":
        "POST, GET, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "content-type, mcp-session-id",
      "Access-Control-Expose-Headers":
        "Mcp-Session-Id",
    });

    res.end();
    return;
  }

  /*
   * Teste simples do servidor.
   */
  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, {
      "content-type": "text/plain; charset=utf-8",
    });

    res.end(
      "Atleta Performance MCP server online."
    );

    return;
  }

  /*
   * Endpoint MCP.
   */
  if (
    url.pathname === MCP_PATH &&
    ["POST", "GET", "DELETE"].includes(req.method)
  ) {
    res.setHeader(
      "Access-Control-Allow-Origin",
      "*"
    );

    res.setHeader(
      "Access-Control-Expose-Headers",
      "Mcp-Session-Id"
    );

    const server = createAtletaServer();

    const transport =
      new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });

    res.on("close", () => {
      transport.close();
      server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error("Erro no MCP:", error);

      if (!res.headersSent) {
        res.writeHead(500);
        res.end("Internal server error");
      }
    }

    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

httpServer.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `Atleta Performance MCP rodando na porta ${PORT}`
    );
  }
);
