const fs = require('fs');
const path = require('path');

const packageJsonPath = path.resolve(__dirname, '../package.json');
const gradlePath = path.resolve(__dirname, '../android/app/build.gradle');

// 1. Bump package.json
const packageJson = require(packageJsonPath);
const versionParts = packageJson.version.split('.');
versionParts[2] = parseInt(versionParts[2]) + 1;
const newVersion = versionParts.join('.');
packageJson.version = newVersion;

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
console.log(`Bumped package.json to ${newVersion}`);

// 2. Bump android/app/build.gradle
let gradleContent = fs.readFileSync(gradlePath, 'utf8');

// Update versionName
// Pattern: versionName "1.0.0"
gradleContent = gradleContent.replace(
    /versionName "[^"]+"/,
    `versionName "${newVersion}"`
);

// Update versionCode
// Pattern: versionCode 1
const versionCodeMatch = gradleContent.match(/versionCode (\d+)/);
if (versionCodeMatch) {
    const currentCode = parseInt(versionCodeMatch[1]);
    const newCode = currentCode + 1;
    gradleContent = gradleContent.replace(
        /versionCode \d+/,
        `versionCode ${newCode}`
    );
    console.log(`Bumped Android versionCode to ${newCode}`);
}

fs.writeFileSync(gradlePath, gradleContent);
console.log(`Updated android/app/build.gradle to version ${newVersion}`);
