declare module "onscan.js" {
  interface OnScanOptions {
    onScan: (code: string, quantity?: number) => void
    onScanError?: (debug: any) => void
    onKeyProcess?: (char: string, event: KeyboardEvent) => void
    onKeyDetect?: (keyCode: number, event: KeyboardEvent) => void
    timeBeforeScanTest?: number
    avgTimeByChar?: number
    minLength?: number
    suffixKeyCodes?: number[]
    prefixKeyCodes?: number[]
    reactToKeydown?: boolean
    reactToPaste?: boolean
    ignoreIfFocusOn?: boolean | string | HTMLElement
  }

  const onScan: {
    attachTo: (element: HTMLElement | Document, options?: OnScanOptions) => void
    detachFrom: (element: HTMLElement | Document) => void
    setOptions: (element: HTMLElement | Document, options: Partial<OnScanOptions>) => void
    getOptions: (element: HTMLElement | Document) => OnScanOptions
  }

  export default onScan
}
