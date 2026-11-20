import type { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  SwaggerModule,
  type OpenAPIObject,
} from '@nestjs/swagger';

import { REFRESH_TOKEN_COOKIE } from '../auth/auth.constants';
import {
  BEARER_AUTH,
  REFRESH_COOKIE_AUTH,
  SWAGGER_JSON_PATH,
  SWAGGER_PATH,
  SWAGGER_TAGS,
  SWAGGER_YAML_PATH,
} from './swagger.constants';

const HTTP_METHODS = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'head',
  'options',
  'trace',
] as const;

const ERROR_SCHEMA_REF = {
  $ref: '#/components/schemas/ErrorResponseDto',
};

function applyCommonResponses(document: OpenAPIObject): void {
  for (const pathItem of Object.values(document.paths)) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];

      if (!operation) {
        continue;
      }

      const requiresBearer = operation.security?.some(
        (requirement) => BEARER_AUTH in requirement,
      );

      if (requiresBearer && !operation.responses['401']) {
        operation.responses['401'] = {
          description: 'Token ausente, inválido o expirado.',
          content: {
            'application/json': {
              schema: ERROR_SCHEMA_REF,
            },
          },
        };
      }

      if (!operation.responses['500']) {
        operation.responses['500'] = {
          description: 'Error interno del servidor.',
          content: {
            'application/json': {
              schema: ERROR_SCHEMA_REF,
            },
          },
        };
      }
    }
  }
}

const DESCRIPTION = `
## API de gestión integral para gimnasios

GymFlow expone una API REST versionada para administrar socios, planes,
membresías, pagos, asistencias, usuarios y eventos. Todos los endpoints
trabajan con el gimnasio asociado al usuario autenticado.

### Cómo autenticarse

1. Ejecuta **POST /api/v1/auth/login** con un usuario de demostración.
2. Copia el valor de \`accessToken\` de la respuesta.
3. Pulsa el botón **Authorize** (arriba a la derecha) e ingresa el token
   como **Bearer**. La autorización se conserva al recargar la página.
4. Ya puedes probar cualquier endpoint protegido con **Try it out**.

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | \`admin@gymflow.local\` | \`Admin123!\` |
| Recepción | \`recepcion@gymflow.local\` | \`Recepcion123!\` |

> El **access token** dura 15 minutos. La sesión se renueva con
> **POST /api/v1/auth/refresh** usando la cookie \`${REFRESH_TOKEN_COOKIE}\`.
> Algunas acciones (cancelar, reversar, desactivar o gestionar usuarios)
> requieren el rol **ADMIN**.

### Convenciones

- Fechas y horas en formato **ISO 8601** (\`2026-11-17T10:30:00.000Z\`).
- Fechas de calendario en formato **YYYY-MM-DD**.
- Importes monetarios expresados como **string decimal** con dos decimales.
- Los errores de validación devuelven \`400\` con el detalle de cada campo.
`;

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('GymFlow API')
    .setDescription(DESCRIPTION)
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Access token JWT obtenido en POST /api/v1/auth/login. ' +
          'Ingrésalo sin el prefijo "Bearer".',
      },
      BEARER_AUTH,
    )
    .addCookieAuth(
      REFRESH_TOKEN_COOKIE,
      {
        type: 'apiKey',
        in: 'cookie',
        description:
          'Cookie httpOnly con el refresh token emitido por el login. ' +
          'Swagger la envía automáticamente si el navegador la tiene.',
      },
      REFRESH_COOKIE_AUTH,
    )
    .addTag(SWAGGER_TAGS.AUTH, 'Inicio de sesión, renovación y perfil.')
    .addTag(SWAGGER_TAGS.HEALTH, 'Estado de disponibilidad del servicio.')
    .addTag(SWAGGER_TAGS.MEMBERS, 'Registro y mantenimiento de socios.')
    .addTag(SWAGGER_TAGS.PLANS, 'Catálogo de planes del gimnasio.')
    .addTag(SWAGGER_TAGS.MEMBERSHIPS, 'Altas y cancelaciones de membresías.')
    .addTag(SWAGGER_TAGS.PAYMENTS, 'Registro y reverso de pagos.')
    .addTag(SWAGGER_TAGS.ATTENDANCES, 'Check-in por QR o código de socio.')
    .addTag(SWAGGER_TAGS.DASHBOARD, 'Indicadores consolidados del gimnasio.')
    .addTag(SWAGGER_TAGS.USERS, 'Gestión de usuarios internos (solo ADMIN).')
    .addTag(SWAGGER_TAGS.EVENTS, 'Clases, talleres y competencias.')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey, methodKey) =>
      `${controllerKey}_${methodKey}`,
  });

  applyCommonResponses(document);

  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    customSiteTitle: 'GymFlow API · Documentación',
    jsonDocumentUrl: SWAGGER_JSON_PATH,
    yamlDocumentUrl: SWAGGER_YAML_PATH,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      docExpansion: 'none',
      deepLinking: true,
      tryItOutEnabled: true,
      syntaxHighlight: {
        theme: 'obsidian',
      },
    },
  });
}
