/**
 * 微信小程序echarts修复脚本
 * 
 * 使用方法：
 * 1. 将此文件放在项目根目录
 * 2. 在微信开发者工具中执行此文件（通过"工具"菜单的"构建npm"之后执行）
 * 3. 执行完成后会修改echarts.js文件，去除AMD模块检测
 */

const fs = require('fs');
const path = require('path');

// echarts文件路径
const echartsPath = path.join(__dirname, 'miniprogram/components/ec-canvas/echarts.js');

try {
  // 读取文件内容
  let content = fs.readFileSync(echartsPath, 'utf8');
  
  // 替换AMD模块检测代码
  // 将 "function"==typeof define&&define.amd?define(["exports"],e)
  // 替换为 false
  content = content.replace(/"function"==typeof define&&define\.amd\?define\(\["exports"\],e\)/g, 'false');
  
  // 写回文件
  fs.writeFileSync(echartsPath, content, 'utf8');
  
  console.log('成功修复echarts.js AMD模块检测问题');
} catch (err) {
  console.error('修复echarts.js时出错:', err);
} 