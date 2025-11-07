import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { QueryFailedExceptionFilter } from './filters/query-failed-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new QueryFailedExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
