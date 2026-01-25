#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class ServiceMethodAnalyzer {
  constructor() {
    this.basePath = process.cwd();
  }

  extractMethods(code, fileName) {
    const methods = new Set();
    
    // 匹配 async 方法
    const asyncRegex = /async\s+(\w+)\s*\(/g;
    let match;
    while ((match = asyncRegex.exec(code)) !== null) {
      const methodName = match[1];
      if (methodName !== 'constructor' && !methodName.startsWith('_')) {
        methods.add(methodName);
      }
    }

    // 匹配普通方法
    const methodRegex = /^\s*(\w+)\s*\([^)]*\)\s*\{/gm;
    while ((match = methodRegex.exec(code)) !== null) {
      const methodName = match[1];
      if (methodName !== 'constructor' && !methodName.startsWith('_')) {
        methods.add(methodName);
      }
    }

    return Array.from(methods).sort();
  }

  analyzeService(serviceName) {
    const directusPath = `./client/src/services/${serviceName}Service.js`;
    const rustPath = `./client/src/rustServices/rust${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Service.js`;

    if (!fs.existsSync(directusPath) || !fs.existsSync(rustPath)) {
      console.log(`❌ 找不到服務文件: ${serviceName}`);
      return null;
    }

    const directusCode = fs.readFileSync(directusPath, 'utf8');
    const rustCode = fs.readFileSync(rustPath, 'utf8');

    const directusMethods = this.extractMethods(directusCode, directusPath);
    const rustMethods = this.extractMethods(rustCode, rustPath);

    const directusSet = new Set(directusMethods);
    const rustSet = new Set(rustMethods);

    const bothHave = directusMethods.filter(m => rustSet.has(m));
    const onlyDirectus = directusMethods.filter(m => !rustSet.has(m));
    const onlyRust = rustMethods.filter(m => !directusSet.has(m));

    return {
      serviceName,
      directusMethods,
      rustMethods,
      bothHave,
      onlyDirectus,
      onlyRust,
      compatibility: (bothHave.length / Math.max(directusMethods.length, rustMethods.length) * 100).toFixed(1)
    };
  }

  generateReport(services) {
    console.log('\n🔍 雙後端服務方法比較報告');
    console.log('='.repeat(50));

    services.forEach(service => {
      if (!service) return;

      console.log(`\n📋 ${service.serviceName.toUpperCase()} SERVICE`);
      console.log(`兼容性: ${service.compatibility}%`);
      console.log(`Directus: ${service.directusMethods.length} 方法`);
      console.log(`Rust: ${service.rustMethods.length} 方法`);
      console.log(`共同: ${service.bothHave.length} 方法`);
      
      if (service.onlyDirectus.length > 0) {
        console.log(`\n⚠️  只在 Directus 中:`);
        service.onlyDirectus.forEach(m => console.log(`   - ${m}`));
      }
      
      if (service.onlyRust.length > 0) {
        console.log(`\n🦀 只在 Rust 中:`);
        service.onlyRust.forEach(m => console.log(`   - ${m}`));
      }
    });
  }

  run() {
    const serviceNames = ['activity', 'registration', 'monthlyDonate', 'joinRecord'];
    const results = serviceNames.map(name => this.analyzeService(name));
    this.generateReport(results);
  }
}

const analyzer = new ServiceMethodAnalyzer();
analyzer.run();
