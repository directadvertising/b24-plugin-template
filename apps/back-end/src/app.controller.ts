import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@/auth/auth.guard";

@Controller()
export class AppController {
  @Get("health")
  @UseGuards(AuthGuard)
  getHealth() {
    return {
      status: "healthy",
      backend: "node",
      timestamp: Math.floor(Date.now() / 1000),
    };
  }

  @Post("install")
  install(@Body() body: Record<string, unknown>) {
    console.log("/api/install", body);
    return { message: "All success" };
  }
}
