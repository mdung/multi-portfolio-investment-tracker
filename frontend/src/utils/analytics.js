// Analytics utility - can be integrated with Google Analytics, Mixpanel, etc.

export const trackEvent = (eventName, properties = {}) => {
  // Google Analytics 4
  if (window.gtag) {
    window.gtag('event', eventName, properties)
  }
  
  // Mixpanel
  if (window.mixpanel) {
    window.mixpanel.track(eventName, properties)
  }
  
  // Custom analytics
  console.log('Analytics Event:', eventName, properties)
}

export const trackPageView = (pageName) => {
  if (window.gtag) {
    window.gtag('config', 'GA_MEASUREMENT_ID', {
      page_path: pageName
    })
  }
  
  if (window.mixpanel) {
    window.mixpanel.track('Page View', { page: pageName })
  }
}

export const identifyUser = (userId, traits = {}) => {
  if (window.mixpanel) {
    window.mixpanel.identify(userId)
    window.mixpanel.people.set(traits)
  }
}

