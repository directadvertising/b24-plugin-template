import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";

interface ContractRoute {
  params: z.ZodType | null;
  query: z.ZodType | null;
  body: z.ZodType | null;
  response: {
    data: z.ZodType | null;
  };
}

function formatZodIssues(error: z.ZodError): Record<string, string> {
  const issues: Record<string, string> = {};
  for (const issue of error.issues) {
    issues[issue.path.join(".")] = issue.message;
  }
  return issues;
}

export class ContractError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function contractMiddleware(route: ContractRoute) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (route.params) {
      const result = route.params.safeParse(req.params);
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Invalid URL parameters",
            issues: formatZodIssues(result.error),
          },
        });
        return;
      }
      req.params = result.data as typeof req.params;
    }

    if (route.query) {
      const result = route.query.safeParse(req.query);
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Invalid query parameters",
            issues: formatZodIssues(result.error),
          },
        });
        return;
      }
      Object.defineProperty(req, "query", {
        value: result.data,
        writable: true,
        configurable: true,
      });
    }

    if (route.body) {
      const result = route.body.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Invalid request body",
            issues: formatZodIssues(result.error),
          },
        });
        return;
      }
      req.body = result.data;
    }

    const originalJson = res.json.bind(res);
    res.json = ((data: unknown) => {
      if (res.statusCode >= 400) {
        return originalJson(data);
      }

      if (route.response.data) {
        const result = route.response.data.safeParse(data);
        if (!result.success) {
          console.error(
            "Response validation error",
            JSON.stringify(result.error, null, 2),
          );
          res.status(500);
          return originalJson({
            success: false,
            error: {
              code: "INTERNAL_SERVER_ERROR",
              message: "Invalid server response",
            },
          });
        }
        return originalJson({ success: true, data: result.data });
      }

      return originalJson({ success: true, data });
    }) as Response["json"];

    next();
  };
}

export function contractErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ContractError) {
    res.status(err.status).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    success: false,
    error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" },
  });
}
