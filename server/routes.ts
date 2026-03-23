
import type { Express } from "express";
import type { Server } from "http";
import { AssignmentLimitError, storage } from "./storage";
import { api } from "@shared/routes";
import { boardItemKindSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post(api.board.create.path, async (req, res) => {
    try {
      const input = api.board.create.input.parse(req.body);
      const createdItem = await storage.createBoardItem(input);
      res.status(201).json(createdItem);
    } catch (err) {
      if (err instanceof AssignmentLimitError) {
        return res.status(400).json({
          message: `Límite alcanzado: ${err.cadence === "daily" ? "6 diarias" : "2 semanales"} por niño.`,
        });
      }
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      throw err;
    }
  });

  app.get(api.board.list.path, async (req, res) => {
    const parsed = api.board.list.input.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid kid filter" });
    }

    const boardItems = await storage.getBoardItems(parsed.data.kidId);
    res.json(boardItems);
  });

  app.patch(api.board.update.path, async (req, res) => {
    const itemId = Number(req.params.id);
    if (!Number.isInteger(itemId) || itemId < 1) {
      return res.status(400).json({ message: "Invalid board item id" });
    }

    try {
      const itemKind = boardItemKindSchema.parse(req.params.kind);
      const input = api.board.update.input.parse(req.body);
      const updatedItem = await storage.updateBoardItem(itemKind, itemId, input);

      if (!updatedItem) {
        return res.status(404).json({ message: "Board item not found" });
      }

      res.json(updatedItem);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      throw err;
    }
  });

  app.delete(api.board.remove.path, async (req, res) => {
    const itemId = Number(req.params.id);
    if (!Number.isInteger(itemId) || itemId < 1) {
      return res.status(400).json({ message: "Invalid board item id" });
    }

    try {
      const itemKind = boardItemKindSchema.parse(req.params.kind);
      const deleted = await storage.deleteBoardItem(itemKind, itemId);
      if (!deleted) {
        return res.status(404).json({ message: "Board item not found" });
      }
      res.status(204).send();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      throw err;
    }
  });

  app.put(api.board.replaceAssignments.path, async (req, res) => {
    const itemId = Number(req.params.id);
    if (!Number.isInteger(itemId) || itemId < 1) {
      return res.status(400).json({ message: "Invalid board item id" });
    }

    try {
      const itemKind = boardItemKindSchema.parse(req.params.kind);
      const input = api.board.replaceAssignments.input.parse(req.body);
      const result = await storage.replaceBoardItemAssignments(itemKind, itemId, input);
      if (!result) {
        return res.status(404).json({ message: "Board item not found" });
      }
      res.json(result);
    } catch (err) {
      if (err instanceof AssignmentLimitError) {
        return res.status(400).json({
          message: `Límite alcanzado: ${err.cadence === "daily" ? "6 diarias" : "2 semanales"} por niño.`,
        });
      }
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
