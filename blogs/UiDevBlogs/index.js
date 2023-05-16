const puppeteer = require("puppeteer-core");
const fs = require("fs");
require("dotenv").config({ path: "../../.env" });
let browser;

// const { persistData, getScrapeData } = require("../../helpers.js");

/**
 * Scrapes the data from the provided page link, using the provided evaluation scheme,
 * and writes it to the specified file.
 * @param {string} pageLink - The URL of the page to scrape.
 * @param {string} fileName - The name of the file to write the data to.
 * @param {string} evaluationScheme - The CSS selector to use for evaluating the data on the page.
 * @returns {void}
 */
const getData = async (pageLink, evaluationScheme) => {
	try {
		const auth =
			process.env.BRIGHTDATA_URL + ":" + process.env.BRIGHTDATA_PASSWORD;
		browser = await puppeteer.connect({
			browserWSEndpoint: `wss://${auth}@zproxy.lum-superproxy.io:9222`,
		});

		console.log(await "browser connected");

		const page = await browser.newPage();
		page.setDefaultNavigationTimeout(2 * 60 * 1000);

		await page.goto(pageLink);

		const body = await page.$("body");

		console.log(await "Link page body received");

		const blog = await page.evaluate((evaluationScheme) => {
			console.log("Evaluation Scheme:", evaluationScheme);
			const blogElements = document.querySelectorAll(evaluationScheme);
			console.log("Blog elements: ", blogElements);
			return Array.from(blogElements).map((blogElement) =>
				blogElement.getAttribute("href")
			);
		}, evaluationScheme);

		// Write the data to the specified file
		return { Links: blog };
	} catch (e) {
		console.log(e);
	} finally {
		await browser?.close();
	}
};
/**
 * Reads the specified file and appends the provided data to it.
 * @param {object} blogLinks - The data to write to the file.
 * @param {string} fileName - The name of the file to write the data to.
 * @returns {void}
 */
const persistData = (blogLinks, fileName) => {
	let data = [];

	try {
		const fileData = fs.readFileSync(fileName);
		data = JSON.parse(fileData);
	} catch (error) {
		console.error(error);
	}

	if (blogLinks) {
		data.push(blogLinks);
	} else {
		return;
	}

	try {
		const jsonData = JSON.stringify(data, null, 2);
		fs.writeFileSync(fileName, jsonData);
		console.log("Data written to file successfully!");
	} catch (error) {
		console.error(error);
	}
};

/**
 * Checks if the specified file is empty. If it is empty, calls the getData function
 * with the specified parameters. Otherwise, logs a message to the console.
 * @returns {void}
 */

const getScrapeData = async (pageLink, fileName, evaluationScheme) => {
	try {
		const stats = fs.statSync(fileName);
		if (stats.size === 0) {
			// Call the getData function with the specified parameters
			const links = await getData(pageLink, evaluationScheme);
			console.log(await links);
			const persistedData = await persistData(links, fileName);
		} else {
			console.log("File already contains data");
			return;
		}
	} catch (error) {
		console.error(error);
	}
};

getScrapeData(
	"https://ui.dev/blog/",
	"./UiDevBlogLinks.json",
	"li.mt-0.text-brand-yellow > a[href]"
);
