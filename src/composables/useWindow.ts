export function useWindow() {
    return {
      open: (url: string, target = '_blank') => {
        window.open(url, target)
      },
      // you can add more helpers later: scrollTo, location, etc.
    }
  }