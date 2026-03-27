# TypeScript Strict TSConfig Templates

Use these templates as overlays. Keep each package/app module strategy intact.

## 1) NodeNext Library Package (`packages/tokun` style)

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "useUnknownInCatchVariables": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist"
  }
}
```

Suggested build config overlay (`tsconfig.build.json`):

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "allowJs": false,
    "emitDeclarationOnly": true,
    "noEmit": false,
    "declarationMap": false,
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.test.ts", "src/**/__tests__/**"]
}
```

## 2) Next.js App (`apps/www` style)

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2017",
    "module": "esnext",
    "moduleResolution": "bundler",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "allowJs": true,
    "noEmit": true,
    "incremental": true,
    "esModuleInterop": true,
    "paths": {
      "@/*": ["./*"]
    },
    "plugins": [{ "name": "next" }]
  }
}
```

## Validation Commands

```bash
# Package declarations/type safety
bunx tsc -p packages/tokun/tsconfig.build.json --noEmit

# App type checks
bunx tsc -p apps/www/tsconfig.json --noEmit

# Workspace-level confidence checks when needed
bun run test
bun run build
```

## Adoption Notes

- Add strict flags incrementally if existing files have drift.
- Prefer fixing the source types over suppressions.
- Avoid disabling strict flags globally to unblock one file.
