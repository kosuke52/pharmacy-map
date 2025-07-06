// next.config.mjs

export default {
  reactStrictMode: true,

  // ★★★ この webpack ブロック全体を削除またはコメントアウト ★★★
  // webpack(config) {
  //   config.module.rules.push({
  //     test: /\.css$/i,
  //     use: ['style-loader', 'css-loader'],
  //   });
  //   return config;
  // },
};