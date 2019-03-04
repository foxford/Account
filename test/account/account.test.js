/* eslint promise/no-callback-in-promise: 0 */
import 'isomorphic-fetch'
import Debug from 'debug'
import fetchMock from 'fetch-mock'
import tap from 'tap'

import { Account } from '../../src/account'
import { IdP } from '../../src/idp'
import { name } from '../../package.json'

import {
  audience,
  tokenData,
  accountResponse,
  refreshResponse,
} from '../response.mock'

global.self = global
// bind global to self for the fetch polyfill
require('whatwg-fetch') // eslint-disable-line node/no-unpublished-require

const debug = Debug(`${name}:account`)

function ClosureStorage (initialState) {
  this.storage = initialState || {}

  this.setItem = (key, value) => {
    if (typeof value !== 'string') throw new TypeError('Wrong value format')
    this.storage[key] = value
  }

  this.getItem = key => this.storage[key]

  this.removeItem = (key) => {
    delete this.storage[key]
  }
}

const getAccount = (opts = {}, store) => {
  debug('Create account instance')

  const options = (opts.account || {
    audience,
    requestMode: 'me',
  })

  debug('Initialize account with options:', options)

  return new Account(
    options,
    new IdP(opts.provider || { endpoint: 'https://mock-host' }),
    store || new ClosureStorage()
  )
}

const fetchMocks = ({
  account,
  label: id,
  action: action = 'refresh',
  response = refreshResponse,
}) => {
  fetchMock.mock(`${account.provider.authnEndpoint}/${id}`, {
    body: accountResponse,
    status: 200,
  }, {
    method: 'GET',
  })

  fetchMock.mock(`${account.provider.accountEndpoint}/${id}/${action}`, {
    body: response,
  }, {
    methods: 'POST',
  })
}

tap.test('Account', (t) => {
  t.test('construct', (test) => {
    let account = getAccount()

    tap.not(account, undefined)
    tap.same(account.id, 'me')
    tap.same(account.label, `me.${audience}`)
    tap.same(account.requestMode, 'me')

    account = getAccount({
      account: {
        label: 'you',
        requestMode: 'label',
        audience,
      },
    })

    tap.not(account, undefined)
    tap.same(account.id, 'you')
    tap.same(account.label, `you.${audience}`)
    tap.same(account.requestMode, 'label')

    account = getAccount({
      account: {
        label: '12345',
        requestMode: 'id',
        audience,
      },
    })

    tap.not(account, undefined)
    tap.same(account.id, '12345')
    tap.same(account.label, `12345.${audience}`)
    tap.same(account.requestMode, 'id')

    tap.throws(() => {
      getAccount({
        account: {},
      })
    }, { message: '`audience` is absent' })

    tap.throws(() => {
      getAccount({
        account: {
          label: 'you',
          requestMode: 'label',
        },
      })
    }, { message: '`audience` is absent' })

    tap.throws(() => {
      getAccount({
        account: {
          requestMode: 'label',
          audience,
        },
      })
    }, { message: '`label` is absent' })

    tap.throws(() => {
      getAccount({
        account: {
          requestMode: 'id',
          audience,
        },
      })
    }, { message: '`label` is absent' })

    test.end()
  })

  t.end()
})

tap.test('Account', (t) => {
  t.test('load void from empty storage', (test) => {
    const strg = new ClosureStorage()
    const acc = getAccount({}, strg)

    acc.load()
      .catch((error) => {
        tap.same(error.message, 'Can not load data')
        test.end()
      })
  })

  t.test('load void from not empty storage', (test) => {
    const strg = new ClosureStorage()
    const acc = getAccount({}, strg)

    strg.setItem(acc.label, '{"a":123}')

    acc.load()
      .then((data) => {
        tap.same(data, { a: 123 })

        return test.end()
      })
      .catch(tap.error)
  })

  t.test('remove void from empty storage', (test) => {
    const strg = new ClosureStorage()
    const acc = getAccount({}, strg)

    acc.remove()
      .catch((error) => {
        tap.same(error.message, 'Can not load data')
        test.end()
      })
  })

  t.test('remove void from not empty storage', (test) => {
    const strg = new ClosureStorage()
    const acc = getAccount({}, strg)

    strg.setItem(acc.label, '{"a":123}')

    acc.remove()
      .then((data) => {
        tap.same(data, { a: 123 })
        tap.same(strg.getItem(acc.label, undefined))

        return test.end()
      })
      .catch(tap.error)
  })

  t.test('load failed as expected', (test) => {
    const strg = new ClosureStorage()
    const acc = getAccount({}, strg)

    strg.setItem(acc.label, '"')

    tap.throws(acc.load)

    test.end()
  })

  t.test('load is ok for valid JSON', (test) => {
    const strg = new ClosureStorage()
    const acc = getAccount({}, strg)

    strg.setItem(acc.label, '{"a":"123"}')

    acc.load()
      .then((data) => {
        tap.same(data, { a: 123 })

        return test.end()
      })
      .catch(tap.error)
  })

  t.test('store a token', (test) => {
    const strg = new ClosureStorage()
    const acc = getAccount({}, strg)

    acc.store({
      access_token: 'somestring',
    })
      .then((data) => {
        tap.same(data, {
          access_token: 'somestring',
          expires_time: 0,
        })

        return test.end()
      })
      .catch(tap.error)
  })

  t.test('store a token that should be expired', (test) => {
    const strg = new ClosureStorage()
    const acc = getAccount({}, strg)
    const _now = global.Date.now
    const sometime = JSON.stringify(_now())

    global.Date.now = () => Number(sometime)

    acc.store({
      expires_in: 2,
      refresh_token: 'somestring',
    })
      .then((data) => {
        tap.same(data, {
          refresh_token: 'somestring',
          expires_in: 2,
          expires_time: Date.now() + 2e3,
        })

        return data
      })
      .finally(() => {
        global.Date.now = _now
        test.end()
      })
      .catch(tap.error)
  })

  t.end()
})

tap.test('Account', (t) => {
  t.test('`tokenData` successful response', (test) => {
    const strg = new ClosureStorage()
    const account = getAccount({
      account: {
        audience,
        label: 'me',
        requestMode: 'label',
      },
    }, strg)

    fetchMocks({
      account, label: 'me',
    })

    account.store(tokenData)
      .then(() => account.tokenData())
      .then((_) => {
        tap.same(JSON.stringify(_), account.storage.getItem(account.label))

        return test.end()
      })
      .catch(tap.error)
  })

  t.end()
})
