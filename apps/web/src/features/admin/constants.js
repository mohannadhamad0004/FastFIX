import { ROLES } from '../../authorization/roles.js'
import { TAG_PALETTE } from '../../utils/tagColors.js'

// What a tag can be attached to, and the admin page tab for each.
export const TAG_TYPES = Object.freeze([
  { value: 'part', label: 'Part tags', examples: 'e.g. Genuine OEM, Best Seller, On Offer' },
  { value: 'mechanic', label: 'Mechanic tags', examples: 'e.g. Top Rated, Mobile Service, 24/7' },
  { value: 'tow', label: 'Tow tags', examples: 'e.g. 24/7, Fast Response, Heavy Vehicles' },
])

// Tag colors: { value, label, token }. Defined with their theme tokens in utils/tagColors.js;
// draw them with tagColor(value). All are dark enough for white badge text in both themes.
export const TAG_COLORS = TAG_PALETTE

export const TAG_NAME_MAX_LENGTH = 30

// Roles whose signups need approval, in tab order, with plural labels.
export const APPROVAL_TABS = Object.freeze([
  { role: ROLES.MECHANIC, label: 'Mechanics' },
  { role: ROLES.PARTS_SHOP, label: 'Parts Shops' },
  { role: ROLES.TOW, label: 'Tow Companies' },
])
