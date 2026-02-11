
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
    let tasks = await storage.getTasks();
    if (tasks.length === 0) {
      // Auto-seed if empty
      await seedDatabase();
      tasks = await storage.getTasks();
    }
    res.json(tasks);
  });

  app.post(api.tasks.reset.path, async (req, res) => {
    await seedDatabase();
    const tasks = await storage.getTasks();
    res.status(201).json(tasks);
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

async function seedDatabase() {
  const tasksData = [
    // Daily Tasks (1-7 = Mon-Sun)
    {
      title: "Resumen de deberes",
      timeInfo: "Antes de las 16:00",
      type: "daily",
      requiredDays: [1, 2, 3, 4, 5], // Mon-Fri usually? Brief doesn't specify, assuming school days + maybe weekend study? Let's assume Mon-Fri for homework summary.
      icon: "clipboard-list",
      points: 1
    },
    {
      title: "Estudiar / Hacer deberes",
      timeInfo: "Antes de las 20:00",
      type: "daily",
      requiredDays: [1, 2, 3, 4, 5], // Mon-Fri
      icon: "book-open",
      points: 1
    },
    {
      title: "Cocina limpia y despejada",
      timeInfo: "Antes de las 20:00",
      type: "daily",
      requiredDays: [1, 2, 3, 4, 5, 6, 0], // Every day
      icon: "utensils",
      points: 1
    },
    {
      title: "Mochila preparada",
      timeInfo: "Antes de dormir",
      type: "daily",
      requiredDays: [1, 2, 3, 4, 0], // Sun-Thu nights for next day school? Or daily habit? Brief says "Daily". Let's assume Mon-Fri school days require backpack.
      icon: "backpack",
      points: 1
    },
    {
      title: "Escritorio ordenado",
      timeInfo: "5 min antes de dormir",
      type: "daily",
      requiredDays: [1, 2, 3, 4, 5, 6, 0], // Every day
      icon: "monitor",
      points: 1
    },
    // Weekly Tasks
    {
      title: "Doblar y guardar ropa",
      timeInfo: "Antes de las 18:00",
      type: "weekly",
      requiredDays: [1, 3, 0], // Mon(1), Wed(3), Sun(0)
      icon: "shirt",
      points: 2
    },
    {
      title: "Lavadora/Secadora (Ropa oscura)",
      timeInfo: "Antes de las 16:00",
      type: "weekly",
      requiredDays: [4], // Thu(4)
      icon: "washing-machine",
      points: 2
    }
  ];
  
  await storage.seedTasks(tasksData);
}
