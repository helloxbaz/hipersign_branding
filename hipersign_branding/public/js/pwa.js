(function () {
  function setupPWA() {
    let link = document.querySelector('link[rel="manifest"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }

    // Always replace any framework or cached manifest URL with the Hipersign endpoint.
    link.href = '/api/method/hipersign_branding.pwa.manifest';

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
        .catch(function (error) {
          console.error('Hipersign ERP service worker registration failed:', error);
        });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupPWA);
  } else {
    setupPWA();
  }
})();
