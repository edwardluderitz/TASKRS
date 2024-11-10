module.exports = {
  content: [
    "./public/**/*.html",
    "./public/js/**/*.js",
    "./public/css/**/*.css",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#357abd",
        hover: "#555",
        background: "#f9f9f9",
      },
      borderRadius: {
        custom: "8px",
      },
    },
  },
  plugins: [],
};