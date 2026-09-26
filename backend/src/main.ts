import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  const config = app.get(AppConfigService);

  // Trust proxy for secure cookies behind load balancers/reverse proxies
  app.set('trust proxy', config.trustProxyHops);

  // Configure Helmet securely. Instead of disabling CSP entirely when Swagger is enabled, 
  // we strictly whitelist the specific inline scripts and image sources Swagger UI requires to render.
  app.use(helmet({
    contentSecurityPolicy: config.swaggerEnabled 
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "validator.swagger.io"],
            connectSrc: ["'self'"],
          },
        } 
      : undefined, // Uses Helmet's default strict policy if Swagger is disabled
  }));

  app.use(cookieParser(config.cookieSecret));
  
  // Custom Body Parser limits
  app.useBodyParser('json', { limit: '10kb' });
  
  // Enable CORS with credentials required for cookie-based authentication
  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'X-Request-Id'],
    maxAge: 600,
  });

  // Global Validation
  app.useGlobalPipes(new ValidationPipe({ 
    whitelist: true, 
    forbidNonWhitelisted: true, 
    transform: true 
  }));

  app.enableShutdownHooks();

  // Swagger Documentation Setup
  if (config.swaggerEnabled) {
    const documentOptions = new DocumentBuilder()
      .setTitle('SecureByPay API')
      .setDescription('To test protected endpoints via Swagger, use the /auth/login endpoint first. The browser will store the session cookie automatically.')
      .setVersion('1.0')
      .addCookieAuth(config.sessionCookieName) // Documents that endpoints require this cookie
      .build();

    const document = SwaggerModule.createDocument(app, documentOptions);
    
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        // CRITICAL: Tells Swagger UI to send cross-origin cookies in its API requests
        withCredentials: true,
      },
    });
  }

  await app.listen(config.port);
  new Logger('Bootstrap').log(`API listening on port ${config.port}`);
}

void bootstrap();