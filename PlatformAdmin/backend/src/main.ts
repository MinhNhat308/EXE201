import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

function resolveAllowedOrigins(frontendOrigin?: string) {
  const configuredOrigins =
    frontendOrigin
      ?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [];

  return new Set([...configuredOrigins, "http://localhost:3000", "http://localhost:3001"]);
}

function isAllowedVercelPreview(origin: string) {
  try {
    const url = new URL(origin);
    return url.protocol === "https:" && url.hostname.endsWith(".vercel.app") && url.hostname.startsWith("exe201-bobapos");
  } catch {
    return false;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const allowedOrigins = resolveAllowedOrigins(config.get<string>("FRONTEND_ORIGIN"));

  app.setGlobalPrefix("api");
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin) || isAllowedVercelPreview(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = config.get<number>("PORT") ?? 4000;
  await app.listen(port);
}

bootstrap();
