(function () {
  function setupPWA() {
    let link = document.querySelector('link[rel="manifest"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }

    // A static JSON manifest avoids API response wrappers and is identical on every site.
    link.href = '/manifest.json';

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
