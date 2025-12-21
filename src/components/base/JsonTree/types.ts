// Special root path using null character prefix - impossible to appear in normal JSON paths
export const ROOT_PATH = '\0__root__'

export interface JsonSizeNode {
  key: string
  path: string
  size: number
  percentage: number
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'
  children?: JsonSizeNode[]
}
