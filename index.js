const { getData, persistData } = require("./helpers.js");
const { getData: getUiDevBlogData } = require("./blogs/UiDevBlogs/index.js");
const fs = require("fs");

// getScrapeData(
// 	"https://ui.dev/blog",
// 	"UiDevBlogLinks.json",
// 	"li.mt-0.text-brand-yellow > a[href]"
// );

getUiDevBlogData(
	"https://ui.dev/blog/",
	"./UiDevBlogLinks.json",
	"li.mt-0.text-brand-yellow > a[href]"
);
