import * as nock from 'nock'

import Whoami from './whoami'

let mockMachines: any

jest.mock(
  'netrc-parser',
  () =>
    class {
      machines = mockMachines
    },
)

let api: nock.Scope
let apiKey = process.env.HEROKU_API_KEY

beforeEach(() => {
  delete process.env.HEROKU_API_KEY
  api = nock('https://api.heroku.com')
})

afterEach(() => {
  api.done()
  if (apiKey) process.env.HEROKU_API_KEY = apiKey
})

describe('not logged in', () => {
  beforeEach(() => {
    mockMachines = {
      'api.heroku.com': {},
    }
  })

  it('errors', async () => {
    await expect(Whoami.mock()).rejects.toHaveProperty('code', 100)
  })
})

describe('logged in', () => {
  beforeEach(() => {
    mockMachines = {
      'api.heroku.com': { password: 'myapikey' },
    }
  })

  it('shows login', async () => {
    api.get('/account').reply(200, { email: 'user@heroku.com' })
    let { stdout } = await Whoami.mock()
    expect(stdout).toEqual('user@heroku.com\n')
  })

  it('has expired token', async () => {
    api.get('/account').reply(401)
    await expect(Whoami.mock()).rejects.toHaveProperty('code', 100)
  })
})

describe('errors out', () => {
  beforeEach(() => {
    mockMachines = {
      'api.heroku.com': { password: 'myapikey' },
    }
  })

  it('shows login', async () => {
    api.get('/account').reply(500, { message: 'uh oh!' })
    await expect(Whoami.mock()).rejects.toThrowError('uh oh!')
  })
})
