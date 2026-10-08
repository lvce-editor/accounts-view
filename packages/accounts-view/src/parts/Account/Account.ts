export interface Account {
  readonly active?: boolean
  readonly avatarSrc?: string
  readonly avatarUrl?: string
  readonly color: string
  readonly displayName: string
  readonly email: string
  readonly id: string
  readonly provider: string
  readonly signedIn?: boolean
}
