/**
 * Domain constants — single source of truth for frontend + backend.
 * Do not put React or Express code here.
 */

export const ROLE_VALUES = ['customer', 'seller', 'admin']

export const DEFAULT_ROLE = 'customer'

/** Max units of the same product one customer may buy in one order */
export const MAX_QTY_PER_ITEM_PER_CUSTOMER = 3

export const PASSWORD_MIN_LENGTH = 6
