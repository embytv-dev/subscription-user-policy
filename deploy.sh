#!/bin/bash
echo "\n----------------------- git pull ---------------------\n"
git pull

echo "\n---------------------- npm install -------------------\n"
npm install

echo "\n-------------------- npm run deploy ------------------\n"
npm run deploy
