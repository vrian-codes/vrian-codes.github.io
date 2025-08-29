export default {
  build: {
    outDir: "docs",
    rollupOptions: {
      input: {
        index: "index.html",                  // your homepage (unchanged content)
        game: "asteroidglidertest.html"       // the game page
      }
    }
  }
};
