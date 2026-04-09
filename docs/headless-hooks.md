# Headless Hooks

Headless hooks expose the stateful logic of config-driven components without the render layer. Use them when you need full control over the UI while retaining the config-driven data fetching, action dispatch, and ScreenContext wiring.

> **Rule:** Build the config-driven component first; extract the headless hook from it. Never the reverse.

## Import

```ts
import { useDataList, useAutoForm } from '@lastshotlabs/pocketshot/ui'
```

---

## `useDataList`

Manages data fetching, refresh, item press dispatch, and key extraction for list UIs.

```ts
function useDataList<T = unknown>(config: DataListConfig): UseDataListReturn<T>
```

### Config

Accepts the same config as [`DataList`](../src/ui/components/data/data-list/schema.ts). Relevant fields:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `data` | `string \| { from: string }` | — | Endpoint path or from-ref to fetch |
| `keyExtractor` | `string` | `'id'` | Dot-path into each item for the list key |
| `onItemPress` | `Action` | — | Action dispatched when an item is pressed |
| `refreshable` | `boolean` | `false` | Whether pull-to-refresh dispatches a `refresh` action |

### Return value

```ts
interface UseDataListReturn<T> {
  data: T[] | null        // null while loading, empty array when empty
  isLoading: boolean
  error: Error | null
  refreshing: boolean     // true during pull-to-refresh only
  handleRefresh: () => Promise<void>
  handleItemPress: (item: T) => Promise<void>
  keyExtractor: (item: T, index: number) => string
}
```

### Example

```tsx
import { useDataList } from '@lastshotlabs/pocketshot/ui'

function UserList() {
  const { data, isLoading, error, handleItemPress } = useDataList<User>({
    data: '/api/users',
    onItemPress: { type: 'navigate', path: '/users/[id]' },
  })

  if (isLoading) return <MySkeletonList />
  if (error) return <MyErrorView />
  return (
    <FlatList
      data={data}
      keyExtractor={(u) => u.id}
      renderItem={({ item }) => (
        <UserRow user={item} onPress={() => handleItemPress(item)} />
      )}
    />
  )
}
```

---

## `useAutoForm`

Manages form field state, validation error resolution, and submit dispatch for form UIs.

```ts
function useAutoForm(config: AutoFormConfig): UseAutoFormReturn
```

### Config

Accepts the same config as [`AutoForm`](../src/ui/components/forms/auto-form/schema.ts). Relevant fields:

| Field | Type | Description |
|-------|------|-------------|
| `fields` | `AutoFormField[]` | Field definitions (id, label, type, defaultValue, …) |
| `onSubmit` | `Action` | Action dispatched on submit |
| `onSubmitKey` | `string` | ScreenContext key where form data is published before dispatch |
| `validationErrors` | `Record<string,string> \| { from: string }` | Per-field error strings or from-ref |

### Return value

```ts
interface UseAutoFormReturn {
  formState: Record<string, unknown>       // current field values, keyed by field id
  updateField: (id: string, value: unknown) => void
  handleSubmit: () => Promise<void>        // publishes formState then dispatches onSubmit
  validationErrors: Record<string, string> | undefined
}
```

### Example

```tsx
import { useAutoForm } from '@lastshotlabs/pocketshot/ui'
import { myFormConfig } from './config'

function MyCustomForm() {
  const { formState, updateField, handleSubmit, validationErrors } = useAutoForm(myFormConfig)

  return (
    <KeyboardAvoidingView>
      <TextInput
        value={formState['email'] as string}
        onChangeText={(v) => updateField('email', v)}
        placeholder="Email"
      />
      {validationErrors?.email && <Text>{validationErrors.email}</Text>}
      <Button onPress={handleSubmit} title="Submit" />
    </KeyboardAvoidingView>
  )
}
```

---

## Relationship to config-driven components

| Use case | Recommendation |
|----------|---------------|
| Standard usage, JSON-driven config | Use `DataList` / `AutoForm` components directly |
| Custom item renderer, same data/action wiring | Use `useDataList` |
| Custom form layout, same state/submit wiring | Use `useAutoForm` |
| Completely custom logic | Write your own hook using `useScreenContext` + `useComponentData` |

Headless hooks are Level 2/3 usage — they assume familiarity with the ScreenContext system and the action vocabulary.
