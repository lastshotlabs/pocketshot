import { readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const componentsRoot = join(process.cwd(), 'src/ui/components')
const aggregateConformanceTest = join(
  process.cwd(),
  'src/ui/__tests__/missing-component-conformance.test.tsx',
)

function componentDirectories(): string[] {
  return readdirSync(componentsRoot)
    .filter((category) => category !== '_base')
    .flatMap((category) => {
      const categoryPath = join(componentsRoot, category)
      if (!statSync(categoryPath).isDirectory()) return []
      return readdirSync(categoryPath)
        .map((component) => join(categoryPath, component))
        .filter((path) => statSync(path).isDirectory())
    })
    .sort()
}

function source(path: string): string {
  return readFileSync(path, 'utf8')
}

describe('the complete config-component inventory', () => {
  const directories = componentDirectories()
  const aggregateCoverage = source(aggregateConformanceTest)

  it('retains all 125 public component directories', () => {
    expect(directories).toHaveLength(125)
  })

  it.each(directories.map((directory) => [relative(componentsRoot, directory), directory]))(
    '%s has the complete public implementation surface',
    (_name, directory) => {
      expect(readdirSync(directory)).toEqual(
        expect.arrayContaining([
          'component.tsx',
          'index.ts',
          'schema.ts',
          'standalone.tsx',
          'types.ts',
        ]),
      )
    },
  )

  it.each(directories.map((directory) => [relative(componentsRoot, directory), directory]))(
    '%s inherits the shared schema and forwards stable test IDs',
    (_name, directory) => {
      expect(source(join(directory, 'schema.ts'))).toMatch(
        /\b(?:extendComponentSchema|baseComponentSchema)\b/,
      )
      const component = source(join(directory, 'component.tsx'))
      expect(component).toContain('ComponentWrapper')
      expect(component).toContain('testID')
    },
  )

  it.each(directories.map((directory) => [relative(componentsRoot, directory), directory]))(
    '%s has schema and render conformance coverage',
    (_name, directory) => {
      const testsDirectory = join(directory, '__tests__')
      const hasColocatedComponentTest =
        statExists(testsDirectory) &&
        readdirSync(testsDirectory).some((file) => file === 'component.test.tsx')
      const hasColocatedSchemaTest =
        statExists(testsDirectory) &&
        readdirSync(testsDirectory).some((file) => /^schema\.test\.tsx?$/.test(file))
      const componentName = basename(directory)
      const hasAggregateComponentTest = aggregateCoverage.includes(
        `/components/${relative(componentsRoot, directory)}/component'`,
      )
      const hasAggregateSchemaTest = aggregateCoverage.includes(
        `/components/${relative(componentsRoot, directory)}/schema'`,
      )

      expect(
        hasColocatedComponentTest || hasAggregateComponentTest,
        `${componentName} is missing render coverage`,
      ).toBe(true)
      expect(
        hasColocatedSchemaTest || hasAggregateSchemaTest,
        `${componentName} is missing schema coverage`,
      ).toBe(true)
    },
  )
})

function statExists(path: string): boolean {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}
