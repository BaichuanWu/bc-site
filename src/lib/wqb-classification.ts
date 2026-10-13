export type BrowserPage<T> = { items: T[]; total: number; offset: number; limit: number }
export type DatasetClassification = {
  id: number
  region: string
  delay: number
  universe: string
  datasetId: string
  classificationName: string
  informationMeaning: string
  commonalityDescription: string
  differencesDescription: string
  datafieldIds?: string[]
  datafieldTotal?: number
  createTime: string
  updateTime: string
}
