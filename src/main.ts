import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import { useContainer } from 'class-validator';
import 'dotenv/config';
import cookieParser = require('cookie-parser');
import { URL_FRONTEND } from './url';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const options = new DocumentBuilder()
    .setTitle('Cambiao API')
    .setDescription(
      'This is the documentation for Cambiao API.',
    )
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, options);

  SwaggerModule.setup('', app, document, {
    customfavIcon:
      'https://static-00.iconduck.com/assets.00/swagger-icon-1024x1024-09037v1r.png',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.css',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.css',
    ],
  });

  app.use(cookieParser());

  app.enableCors({
    origin: URL_FRONTEND,
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  app.use((req, res, next) => {
    res.header('Access-Control-Expose-Headers', 'Set-Cookie');
    next();
  });

  app.enableVersioning();
  app.setGlobalPrefix('');

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  const port = process.env.PORT || 4001;
  app.useStaticAssets(path.join(__dirname, '../uploads'));
  await app.listen(port);

}
bootstrap();