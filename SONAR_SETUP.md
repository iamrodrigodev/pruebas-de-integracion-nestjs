# Configuración de SonarQube para el Proyecto

## Prerequisitos

1. **SonarQube Server** ejecutándose (local o remoto)
2. **SonarScanner CLI** instalado
3. Node.js y npm instalados

## Pasos para ejecutar análisis con SonarQube

### 1. Ejecutar tests con cobertura

```bash
# Ejecutar solo tests E2E con cobertura
npm run test:e2e:cov

# O ejecutar todos los tests (unitarios + E2E) - cuando agregues tests unitarios
npm run test:all
```

Esto generará:
- `coverage/lcov.info` - Reporte de cobertura en formato LCOV
- `coverage/junit.xml` - Reporte de ejecución de tests en formato JUnit
- `coverage/clover.xml` - Reporte adicional de cobertura
- `coverage/lcov-report/` - Reporte HTML de cobertura

### 2. Verificar que los archivos de cobertura existen

```bash
# PowerShell
Test-Path coverage/lcov.info
Test-Path coverage/junit.xml

# Si devuelve True, los archivos están listos
```

### 3. Ejecutar análisis de SonarQube

```bash
# Si tienes el script configurado en package.json
npm run sonar

# O directamente con sonar-scanner
sonar-scanner
```

## Configuración de SonarQube Server

Si estás usando SonarQube local, asegúrate de configurar las propiedades del servidor:

```properties
# Agregar al archivo sonar-project.properties si es necesario
sonar.host.url=http://localhost:9000
sonar.login=tu-token-aqui
```

## Estructura de directorios de cobertura

```
coverage/
├── lcov.info              # Usado por SonarQube
├── junit.xml              # Usado por SonarQube
├── clover.xml             # Reporte adicional
├── coverage-final.json    # JSON de cobertura
└── lcov-report/           # Reporte HTML (para visualizar localmente)
    └── index.html
```

## Verificar configuración

### Archivos configurados correctamente:

1. **`jest.config.js`** - Tests unitarios (cuando los agregues)
   - Genera cobertura en `coverage/`

2. **`test/jest-e2e.json`** - Tests E2E
   - Genera cobertura en `coverage/`
   - Incluye reporter `jest-junit`

3. **`sonar-project.properties`** - Configuración de SonarQube
   - Apunta a `coverage/lcov.info`
   - Apunta a `coverage/junit.xml`

## Notas importantes

- Los tests E2E generan la cobertura porque prueban toda la aplicación
- Actualmente no hay tests unitarios, pero la configuración está lista para cuando los agregues
- Los archivos de cobertura se generan en el directorio `coverage/` en la raíz del proyecto
- SonarQube lee estos archivos para generar el análisis de calidad de código

## Troubleshooting

### Error: No se encuentra lcov.info

```bash
# Ejecuta primero los tests con cobertura
npm run test:e2e:cov

# Verifica que el archivo existe
dir coverage
```

### Error: SonarScanner no reconoce los tests

Verifica que `sonar-project.properties` tenga:
```properties
sonar.tests=test
sonar.test.inclusions=**/*.e2e-spec.ts
```

### Error: Cobertura al 0%

Asegúrate de que:
1. Los tests se ejecutaron con `--coverage`
2. El archivo `coverage/lcov.info` existe y no está vacío
3. Las rutas en `sonar-project.properties` son correctas

## Comando rápido completo

```bash
# Limpiar coverage anterior (opcional)
Remove-Item -Recurse -Force coverage -ErrorAction SilentlyContinue

# Ejecutar tests con cobertura
npm run test:e2e:cov

# Ejecutar análisis de SonarQube
npm run sonar
```
