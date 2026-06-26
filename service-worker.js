self.addEventListener("install", event => {
  console.log("Louvor Sync instalado");
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  console.log("Louvor Sync ativo");
});

self.addEventListener("fetch", event => {
  event.respondWith(fetch(event.request));
});
