import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';

@Controller('api')
export class ApiController {
  @Get('health')
  @UseGuards(AuthGuard)
  getHealth() {
    return {
      status: 'healthy',
      backend: 'node',
      timestamp: Math.floor(Date.now() / 1000),
    };
  }

  @Get('enum')
  @UseGuards(AuthGuard)
  getEnum() {
    return ['option 1', 'option 2', 'option 3'];
  }

  @Get('list')
  @UseGuards(AuthGuard)
  getList() {
    return ['element 1', 'element 2', 'element 3'];
  }

  @Post('install')
  install(@Body() body: any) {
    console.log('/api/install', body);
    return { message: 'All success' };
  }
}
