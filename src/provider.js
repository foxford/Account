class Provider {
  constructor () {
    if (this.constructor === Provider) {
      throw new TypeError('Abstract class cannot construct')
    }
  }

  tokenRequest () {
    throw new TypeError('Abstract method `tokenRequest` is not implemented')
  }

  refreshTokenRequest () {
    throw new TypeError('Abstract method `refreshTokenRequest` is not implemented')
  }

  revokeTokenRequest () {
    throw new TypeError('Abstract method `revokeTokenRequest` is not implemented')
  }

  linkRequest () {
    throw new TypeError('Abstract method `linkRequest` is not implemented')
  }

  authRequest () {
    throw new TypeError('Abstract method `authRequest` is not implemented')
  }

  unlinkRequest () {
    throw new TypeError('Abstract method `unlinkRequest` is not implemented')
  }

  accountRequest () {
    throw new TypeError('Abstract method `accountRequest` is not implemented')
  }

  removeAccountRequest () {
    throw new TypeError('Abstract method `removeAccountRequest` is not implemented')
  }

  isEnabledRequest () {
    throw new TypeError('Abstract method `isEnabledRequest` is not implemented')
  }

  enableRequest () {
    throw new TypeError('Abstract method `enableRequest` is not implemented')
  }

  disableRequest () {
    throw new TypeError('Abstract method `disableRequest` is not implemented')
  }
}

export default Provider