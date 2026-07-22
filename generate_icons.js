#!/usr/bin/env node
// generate_icons.js — generates PNG icons for the Chrome extension

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const sizes = [16, 32, 48, 128];
const outputDir = path.join(__dirname, 'icons');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const r = size * 0.18; // corner radius

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#7c3aed');
  grad.addColorStop(1, '#2563eb');

  // Rounded rect
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Scale for drawing
  const s = size / 24;
  ctx.save();
  ctx.scale(s, s);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Inner image icon: rect
  roundRect(ctx, 4, 4, 16, 16, 3);
  ctx.stroke();

  // Circle (sun)
  ctx.beginPath();
  ctx.arc(8.5, 8.5, 1.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fill();

  // Mountain/landscape path
  ctx.beginPath();
  ctx.moveTo(4, 16);
  ctx.lineTo(9, 11);
  ctx.lineTo(13, 15);
  ctx.lineTo(16, 12);
  ctx.lineTo(20, 16);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.stroke();

  ctx.restore();

  return canvas.toBuffer('image/png');
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

sizes.forEach(size => {
  const buf = drawIcon(size);
  const outPath = path.join(outputDir, `icon${size}.png`);
  fs.writeFileSync(outPath, buf);
  console.log(`✓ Generated icon${size}.png`);
});

console.log('All icons generated!');
