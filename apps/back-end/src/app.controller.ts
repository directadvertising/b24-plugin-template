import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getIndex() {
    return ['!default route for index page, please use /api/* routes'];
  }
}
