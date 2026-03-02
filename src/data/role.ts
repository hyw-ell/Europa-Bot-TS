/**
 * - If category is defined, the role can be assigned by members.
 * - If raid is defined, the role is tied to a raid for use with /raidcode.
 * - At least one of category or raid should always be defined.
 */
export interface categoryRole {id: string, category?: string, raids?: string[]}