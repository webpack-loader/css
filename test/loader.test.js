const webpack = require('@webpack-utilities/test')

describe('Loader', () => {
  test('Defaults', async () => {
    const config = {
      loader: {
        test: /\.css$/,
        options: {},
      },
    }

    const stats = await webpack('fixture.js', config)
    const { source } = stats.toJson().modules[1]

    expect(source).toMatchSnapshot()
  })
})
