import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as jwt from "jsonwebtoken";

@Controller()
export class AuthController {
  constructor(private readonly configService: ConfigService) {}

  @Post("getToken")
  getToken(@Body() body: Record<string, unknown>) {
    console.log("/api/getToken", body);

    const jwtSecret = this.configService.get<string>("JWT_SECRET");
    if (!jwtSecret) {
      throw new HttpException(
        { error: "JWT_SECRET is not configured" },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const appInfo = { id: 1 };
    const token = jwt.sign(appInfo, jwtSecret, { expiresIn: "1h" });

    return { token };
  }
}
