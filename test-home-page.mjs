import fetch from 'node-fetch';

async function check() {
  const res = await fetch('http://localhost:5000/');
  const html = await res.text();
  console.log("Deleted product 'Harry potter 1' (or similar) found:", html.toLowerCase().includes("harry potter"));
  console.log("HTML length:", html.length);
  // Let's print the titles of the products found on the home page!
  const titles = [...html.matchAll(/<h3>(.*?)<\/h3>/g)].map(m => m[1].trim());
  console.log("Product titles on Home page:", titles);
}
check();
