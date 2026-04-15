
import { extendComponentSchema } from '../../_base'

const ActionSchema = z.custom<import('../../../actions/types').Action>()

const DrawerMenuItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.string().optional(),
  badge: z.number().optional(),
  section: z.string().optional(),
  onPress: ActionSchema.optional(),
})

const DrawerMenuHeaderSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  avatar: z.string().optional(),
})

const DrawerMenuFooterSchema = z.object({
  label: z.string(),
  onPress: ActionSchema,
})

export const DrawerMenuSchema = extendComponentSchema({
  id: z.string(),
  items: z.array(DrawerMenuItemSchema),
  header: DrawerMenuHeaderSchema.optional(),
  footer: DrawerMenuFooterSchema.optional(),
  position: z.enum(['left', 'right']).optional().default('left'),
  widthPercent: z.number().optional().default(80),
  testID: z.string().optional(),
})

