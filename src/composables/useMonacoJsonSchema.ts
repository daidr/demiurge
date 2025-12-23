import type * as Monaco from 'monaco-editor'
import type { Ref } from 'vue'
import { watch } from 'vue'

export interface JsonSchemaOptions {
  /** Monaco library reference */
  monacoRef: Ref<typeof Monaco | undefined>
  /** JSON Schema string to apply */
  schema: Ref<string>
  /** URI for the schema (default: 'internal://demiurge/user-schema.json') */
  schemaUri?: string
  /** File match pattern (default: ['workspace.json']) */
  fileMatch?: string[]
}

/**
 * Composable for managing Monaco JSON Schema validation
 *
 * Automatically updates Monaco's JSON language service when schema changes.
 *
 * @example
 * ```ts
 * const { monacoRef } = useMonacoModel({ ... })
 * useMonacoJsonSchema({
 *   monacoRef,
 *   schema: myJsonSchema,
 *   fileMatch: ['workspace.json'],
 * })
 * ```
 */
export function useMonacoJsonSchema(options: JsonSchemaOptions) {
  const {
    monacoRef,
    schema,
    schemaUri = 'internal://demiurge/user-schema.json',
    fileMatch = ['workspace.json'],
  } = options

  function updateJsonSchemaValidation(schemaString: string) {
    const monaco = monacoRef.value
    if (!monaco)
      return

    // Get json language service (using any to bypass type issues)
    const jsonDefaults = (monaco.languages as any).json?.jsonDefaults
    if (!jsonDefaults)
      return

    try {
      // Try to parse the schema to validate it's valid JSON
      if (schemaString.trim()) {
        const parsedSchema = JSON.parse(schemaString)

        jsonDefaults.setDiagnosticsOptions({
          validate: true,
          enableSchemaRequest: true,
          allowComments: true,
          schemaValidation: 'error',
          schemas: [
            {
              uri: schemaUri,
              fileMatch,
              schema: parsedSchema,
            },
          ],
        })
      }
      else {
        // No schema provided, use default validation
        jsonDefaults.setDiagnosticsOptions({
          validate: true,
          enableSchemaRequest: true,
          allowComments: true,
          schemaValidation: 'error',
          schemas: [],
        })
      }
    }
    catch {
      // Invalid JSON schema, fall back to default validation
      jsonDefaults.setDiagnosticsOptions({
        validate: true,
        enableSchemaRequest: true,
        allowComments: true,
        schemaValidation: 'error',
        schemas: [],
      })
    }
  }

  // Watch for schema changes
  watch(schema, updateJsonSchemaValidation, { immediate: true })

  // Watch for monaco ref changes (when editor is mounted)
  watch(monacoRef, (monaco) => {
    if (monaco) {
      updateJsonSchemaValidation(schema.value)
    }
  })

  return {
    updateJsonSchemaValidation,
  }
}

/**
 * Configure Monaco JSON language service with Draft-07 schema validation
 *
 * Used for JSON Schema editors to enable schema-aware autocomplete.
 * This function merges with existing schemas instead of replacing them.
 *
 * @example
 * ```ts
 * onMounted(() => {
 *   configureJsonSchemaValidation(monacoRef.value)
 * })
 * ```
 */
export function configureJsonSchemaValidation(monaco: typeof Monaco | undefined) {
  if (!monaco)
    return

  const jsonDefaults = (monaco.languages as any).json?.jsonDefaults
  if (!jsonDefaults)
    return

  // Get existing options to preserve other schemas
  const existingOptions = jsonDefaults.diagnosticsOptions || {}
  const existingSchemas = existingOptions.schemas || []

  // Only add Draft-07 schema if not already present
  const hasDraft07Schema = existingSchemas.some(
    (s: any) => s.fileMatch?.includes('json-schema.json'),
  )

  const schemas = hasDraft07Schema
    ? existingSchemas
    : [
        ...existingSchemas,
        {
          uri: 'http://json-schema.org/draft-07/schema',
          fileMatch: ['json-schema.json'],
        },
      ]

  jsonDefaults.setDiagnosticsOptions({
    ...existingOptions,
    schemas,
    enableSchemaRequest: true,
    allowComments: true,
    schemaValidation: 'error',
    validate: true,
  })
}
