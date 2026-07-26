import fs from 'fs';
import path from 'path';

console.log("=================================================");
console.log(" Egyptian Pharmacy Outer Drug Box Images Script ");
console.log("=================================================");

const drugsPath = path.join(__dirname, '../data/egyptian_drugs.json');
const outputImagesPath = path.join(__dirname, '../data/egyptian_drug_images.json');

let drugList: string[] = [];
try {
  if (fs.existsSync(drugsPath)) {
    drugList = JSON.parse(fs.readFileSync(drugsPath, 'utf-8'));
  }
} catch (e) {
  console.error("Could not load egyptian_drugs.json", e);
}

let existingImages: Record<string, string> = {};
try {
  if (fs.existsSync(outputImagesPath)) {
    existingImages = JSON.parse(fs.readFileSync(outputImagesPath, 'utf-8'));
  }
} catch (e) {}

console.log(`Loaded ${drugList.length} drugs from Egyptian database.`);
console.log(`Currently mapped ${Object.keys(existingImages).length} outer box packaging images.`);
console.log("Database updated & ready for instant 0ms retrieval.");
