const puppeteer = require("puppeteer-core");
const fs = require("fs");
require("dotenv").config({ path: "../../.env" });
const blogLinks = require("./UiDevBlogLinks.json");
let browser;

// const { appendDataToFile, checkAndScrapeData } = require("../../helpers.js");

/**
 * Scrapes the data from the provided page link, using the provided evaluation scheme,
 * and writes it to the specified file.
 * @param {string} pageLink - The URL of the page to scrape.
 * @param {string} fileName - The name of the file to write the data to.
 * @param {string} evaluationScheme - The CSS selector to use for evaluating the data on the page.
 * @returns {void}
 */
const scrapePageData = async (pageLink, evaluationScheme) => {
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

		const pageOutput = await page.evaluate((evaluationScheme) => {
			const allElements = document.body.innerText;
			allElements
				.replace(/\n+/g, " ") // Replace multiple line breaks with a single space
				.replace(/\s+/g, " ") // Replace multiple spaces with a single space
				.trim(); // Remove any leading or trailing spaces
			// document.querySelectorAll(evaluationScheme);
			// document.body.innerText;
			// let text = "";
			// allElements.forEach((element) => {
			// 	if (element.nodeType === 3) {
			// 		text += element.textContent;
			// 	}
			// });
			return allElements;
		}, evaluationScheme);

		return { pageOutput: pageOutput };
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
const appendDataToFile = (blogLinks, fileName) => {
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
 * Checks if the specified file is empty. If it is empty, calls the scrapePageData function
 * with the specified parameters. Otherwise, logs a message to the console.
 * @returns {void}
 */

const checkAndScrapeData = async (pageLink, fileName, evaluationScheme) => {
	try {
		const stats = fs.statSync(fileName);
		if (stats.size === 0) {
			// Call the scrapePageData function with the specified parameters
			const links = await scrapePageData(pageLink, evaluationScheme);
			console.log(await links);
			const persistedData = await appendDataToFile(links, fileName);
		} else {
			console.log("File already contains data :", fileName);
			return;
		}
	} catch (error) {
		console.error(error);
	}
};

const scrapeAllPagesData = async () => {
	const base_url = "https://ui.dev";
	const urls = blogLinks[0].Links;
	console.log("semi-links ", urls);
	const pageLinks = urls.map((url) => `${base_url}${url}`);
	// const pageLinks = "https://ui.dev/why-react-renders";
	console.log("full-links ", pageLinks);
	const allData = await Promise.all(
		pageLinks.map(async (pageLink) => {
			const data = await checkAndScrapeData(
				pageLink,
				"./fullBlogs.json",
				"*"
			);
		})
	);
};

scrapeAllPagesData();
