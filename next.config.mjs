// 既にある内容に追記 or 上書き
export default {
    reactStrictMode: true,
  
    webpack(config) {
      config.module.rules.push({
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      });
      return config;
    },
  };
  