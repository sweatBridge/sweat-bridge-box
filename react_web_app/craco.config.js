module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      const sourceMapRule = webpackConfig.module.rules.find(
        (rule) =>
          rule.enforce === 'pre' &&
          (
            (typeof rule.loader === 'string' && rule.loader.includes('source-map-loader')) ||
            (
              Array.isArray(rule.use) &&
              rule.use.some(
                (useEntry) =>
                  typeof useEntry === 'object' &&
                  useEntry !== null &&
                  'loader' in useEntry &&
                  typeof useEntry.loader === 'string' &&
                  useEntry.loader.includes('source-map-loader')
              )
            )
          )
      );

      const reactDatepickerSource = /node_modules[\\/]+react-datepicker[\\/]+src[\\/]+date_utils\.ts$/;

      if (sourceMapRule) {
        const existingExclude = sourceMapRule.exclude;

        if (Array.isArray(existingExclude)) {
          sourceMapRule.exclude = [...existingExclude, reactDatepickerSource];
        } else if (existingExclude) {
          sourceMapRule.exclude = [existingExclude, reactDatepickerSource];
        } else {
          sourceMapRule.exclude = [reactDatepickerSource];
        }
      }

      webpackConfig.ignoreWarnings = [
        ...(webpackConfig.ignoreWarnings || []),
        /Critical dependency: the request of a dependency is an expression/
      ];

      return webpackConfig;
    }
  }
};
