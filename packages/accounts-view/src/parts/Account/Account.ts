export interface Account {
  readonly active?: boolean
  readonly color: string
  readonly displayName: string
  readonly email: string
  readonly id: string
  readonly provider: string
  readonly signedIn?: boolean
}
