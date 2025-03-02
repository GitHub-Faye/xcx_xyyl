module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false, // 禁用模块转换
        loose: true,    // 使用松散模式生成更简单的代码
        targets: {
          browsers: ['last 2 versions', 'android >= 4.0', 'ios >= 8.0']
        }
      }
    ]
  ],
  plugins: [
    // 禁用转换为AMD或CommonJS
    ['@babel/plugin-transform-modules-commonjs', { loose: true, strict: false }],
    
    // 使用inline的Babel助手而非引入额外模块
    ['@babel/plugin-transform-runtime', {
      helpers: true,      // 使用内联助手
      corejs: false,      // 不使用core-js
      regenerator: true,  // 转换generator函数
      useESModules: false // 不使用ES模块
    }]
  ]
}; 