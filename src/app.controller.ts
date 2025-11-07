import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('/health')
  health(): { message: string; statusCode: number } {
    return { message: 'Backend funcionando correctamente', statusCode: 200 };
  }
}