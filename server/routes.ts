
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get(api.tasks.list.path, async (req, res) => {
    const tasks = await storage.getTasks();
    res.json(tasks);
  });

  app.get(api.completions.list.path, async (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate required" });
    }
    const completions = await storage.getCompletions(String(startDate), String(endDate));
    res.json(completions);
  });

  app.post(api.completions.toggle.path, async (req, res) => {
    try {
      const input = api.completions.toggle.input.parse(req.body);
      const completion = await storage.toggleCompletion(input);
      res.json(completion);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      throw err;
    }
  });

  return httpServer;
}
