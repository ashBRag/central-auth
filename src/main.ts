import "reflect-metadata";
import * as dotenv from "dotenv";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { LoggerService } from "@libs/logger";
import { AllExceptionsFilter } from "./errors/http-exception.filter";
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { bufferLogs: true }
  );
  app.useLogger(app.get(LoggerService));
  app.setGlobalPrefix("v1", {
    exclude: ["health", "metrics"],
  });
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Central Auth")
    .setDescription("Centralised Authentication And Authorization")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, swaggerDoc, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(Number(process.env.PORT) || 3000, "0.0.0.0");
}
bootstrap();
