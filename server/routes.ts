
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
    const parsed = api.tasks.list.input.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid kid filter" });
    }

    const tasks = await storage.getTasks(parsed.data.kidId);
    res.json(tasks);
  });

  app.patch(api.tasks.update.path, async (req, res) => {
    const taskId = Number(req.params.id);
    if (!Number.isInteger(taskId) || taskId < 1) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    try {
      const input = api.tasks.update.input.parse(req.body);
      const updatedTask = await storage.updateTask(taskId, input);

      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.json(updatedTask);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      throw err;
    }
  });

  app.put(api.tasks.replaceAssignments.path, async (req, res) => {
    const taskId = Number(req.params.id);
    if (!Number.isInteger(taskId) || taskId < 1) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    try {
      const input = api.tasks.replaceAssignments.input.parse(req.body);
      const result = await storage.replaceTaskAssignments(taskId, input);
      if (!result) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      throw err;
    }
  });

  app.get(api.kids.list.path, async (_req, res) => {
    const kids = await storage.getKids();
    res.json(kids);
  });

  app.post(api.kids.create.path, async (req, res) => {
    try {
      const input = api.kids.create.input.parse(req.body);
      const kid = await storage.createKid(input);
      res.status(201).json(kid);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      return res.status(400).json({ message: "Could not create kid" });
    }
  });

  app.patch(api.kids.update.path, async (req, res) => {
    const kidId = Number(req.params.id);
    if (!Number.isInteger(kidId) || kidId < 1) {
      return res.status(400).json({ message: "Invalid kid id" });
    }

    try {
      const input = api.kids.update.input.parse(req.body);
      const kid = await storage.updateKid(kidId, input);
      if (!kid) return res.status(404).json({ message: "Kid not found" });
      res.json(kid);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      return res.status(400).json({ message: "Could not update kid" });
    }
  });

  app.delete(api.kids.remove.path, async (req, res) => {
    const kidId = Number(req.params.id);
    if (!Number.isInteger(kidId) || kidId < 1) {
      return res.status(400).json({ message: "Invalid kid id" });
    }

    const deleted = await storage.deleteKid(kidId);
    if (!deleted) return res.status(404).json({ message: "Kid not found" });
    res.status(204).send();
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
