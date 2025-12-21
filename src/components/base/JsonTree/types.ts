export interface JsonSizeNode {
  key: string
  path: string
  size: number
  percentage: number
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'
  children?: JsonSizeNode[]
}
