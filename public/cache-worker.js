
// Cache manager web worker
self.onmessage = function(e) {
  const { type, cacheVersion } = e.data;
  
  switch(type) {
    case 'CLEAN_OLD_CACHES':
      cleanOldCaches(cacheVersion);
      break;
  }
};

async function cleanOldCaches(currentVersion) {
  try {
    const cacheNames = await caches.keys();
    const deletionPromises = cacheNames
      .filter(name => name !== currentVersion)
      .map(name => caches.delete(name));
    
    await Promise.all(deletionPromises);
    self.postMessage({ type: 'CLEANUP_COMPLETE' });
  } catch (error) {
    self.postMessage({ type: 'CLEANUP_ERROR', error: error.message });
  }
}
