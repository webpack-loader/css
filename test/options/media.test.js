const webpack = require('@webpack-utilities/test')

describe('Options', () => {
  describe('media', () => {
    test('{Boolean}', async () => {
      const config = {
        loader: {
          test: /\.css$/,
          options: {}
        }
      }

      const stats = await webpack('media/fixture.js', config)
      const { source } = stats.toJson().modules[1]

      expect(source).toMatchSnapshot()
    })
  })
})
