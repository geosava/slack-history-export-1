import test from 'tape'
import sinon from 'sinon'
import streamTest from 'streamtest'
import SlackHistoryExport from 'main'

let SLACK_API_TOKEN

if (process.env.CI === 'true')
  SLACK_API_TOKEN = process.env.SLACK_API_TOKEN
else
  SLACK_API_TOKEN = process.env.npm_config_slacktoken

test('SlackHistoryExport is a function', (t) => {
  t.equal(typeof SlackHistoryExport, 'function')

  t.end()
})

test(`SlackHistoryExport
  should initialize default values and methods`, (t) => {
  const slackHistoryExport = new SlackHistoryExport({ token: SLACK_API_TOKEN })

  t.ok(slackHistoryExport.args)
  t.ok(slackHistoryExport.slack, 'Slack api method is present')
  t.ok(slackHistoryExport.fetchIMHistory, 'fetchIMHistory method is present')
  t.ok(slackHistoryExport.fetchUserDetail, 'fetchUserDetail method is present')
  t.ok(slackHistoryExport.fetchIMInfo, 'fetchIMInfo method is present')
  t.ok(
    slackHistoryExport.fetchGroupHistory,
    'fetchGroupHistory method is present',
  )
  t.ok(
    slackHistoryExport.fetchGroupDetails,
    'fetchGroupDetails method is present',
  )
  t.ok(
    slackHistoryExport.fetchChannelDetails,
    'fetchChannelDetails method is present',
  )
  t.ok(
    slackHistoryExport.fetchChannelHistory,
    'fetchChannelHistory method is present',
  )
  t.end()
})

test(`SlackHistoryExport::fetchIMInfo
  should fetch IM info for a user`, (t) => {
  const slackHistoryExport = new SlackHistoryExport({ token: SLACK_API_TOKEN })
  slackHistoryExport.slack = {
    im: () => Promise.resolve({
      ims: [
        {
          user: 'USLACKBOT',
        },
        {
          user: 'U024BE7LH',
        },
      ],
    }),
  }
  const mockUserObj = {
    id: 'USLACKBOT',
    user: 'SLACKBOT',
  }
  slackHistoryExport.fetchIMInfo(mockUserObj).then((result) => {
    t.equal(result.user, 'USLACKBOT', 'User imInfo is fetch')
    t.end()
  })
})

test(`SlackHistoryExport::fetchUserDetail
  should fetchUserDetail`, (t) => {
  const slackHistoryExport = new SlackHistoryExport({ token: SLACK_API_TOKEN })
  slackHistoryExport.slack = {
    users: () => Promise.resolve({
      members: [
        {
          id: 'U023BECGF',
          name: 'bobby',
        },
      ],
    }),
  }
  slackHistoryExport.fetchUserDetail('bobby').then((result) => {
    t.equal(result.name, 'bobby', 'User details is returned')
    t.end()
  })
})

test(`SlackHistoryExport::fetchGroupDetails
  should fetchGroupDetails`, (t) => {
  const slackHistoryExport = new SlackHistoryExport({ token: SLACK_API_TOKEN })
  slackHistoryExport.slack = {
    groups: () => Promise.resolve({
      groups: [
        {
          id: 'U023BECGF',
          name: 'admins',
        },
      ],
    }),
  }
  slackHistoryExport.fetchGroupDetails('admins').then((result) => {
    t.equal(result.name, 'admins', 'Group details is returned')
    t.end()
  })
})

test(`SlackHistoryExport::fetchChannelDetails
  should fetchChannelDetails`, (t) => {
  const slackHistoryExport = new SlackHistoryExport({ token: SLACK_API_TOKEN })
  slackHistoryExport.slack = {
    channels: () => Promise.resolve({
      channels: [
        {
          id: 'U023BECGF',
          name: 'general',
        },
      ],
    }),
  }
  slackHistoryExport.fetchChannelDetails('general').then((result) => {
    t.equal(result.name, 'general', 'channel details is returned')
    t.end()
  })
})

test(`SlackHistoryExport::fetchIMHistory
  should fetchAll userHistory and stream out`, (t) => {
  const slackHistoryExport = new SlackHistoryExport({ token: SLACK_API_TOKEN })
  const mockObj = {
    ok: true,
    messages: [
      {
        type: 'message',
        ts: '1358546515.000008',
        user: 'U2147483896',
        text: 'Hello',
      },
      {
        type: 'message',
        ts: '1358546515.000007',
        user: 'U2147483896',
        text: 'World',
        is_starred: true,
      },
      {
        type: 'something_else',
        ts: '1358546515.000007',
        wibblr: true,
      },
    ],
    has_more: false,
  }
  const expectedResult = [
    {
      type: 'message',
      ts: '1358546515.000008',
      user: 'U2147483896',
      text: 'Hello',
      timestamp: 1358546515000,
      isoDate: '2013-01-18T22:01:55.000Z',
    },
    {
      type: 'message',
      ts: '1358546515.000007',
      user: 'U2147483896',
      text: 'World',
      is_starred: true,
      timestamp: 1358546515000,
      isoDate: '2013-01-18T22:01:55.000Z',
    },
    {
      type: 'something_else',
      ts: '1358546515.000007',
      wibblr: true,
      timestamp: 1358546515000,
      isoDate: '2013-01-18T22:01:55.000Z',
    },
  ]
  slackHistoryExport.slack = {
    imHistory: () => Promise.resolve(mockObj),
  }
  const outputStream = streamTest['v2'].toText((err, result) => {
    t.notOk(err, 'No error occurred')
    const _result = JSON.parse(result)
    t.deepEqual(_result, expectedResult)
    t.end()
  })
  slackHistoryExport.fetchIMHistory(outputStream, 'CHANNEL', null, false)
})

test(`SlackHistoryExport::fetchIMHistory
  should fetch more user history and stream out`, (t) => {
  const slackHistoryExport = new SlackHistoryExport({ token: SLACK_API_TOKEN })
  const mockObj1 = {
    ok: true,
    messages: [
      {
        type: 'message',
        ts: '1358546515.000008',
        user: 'U2147483896',
        text: 'Hello',
      },
      {
        type: 'message',
        ts: '1358546515.000007',
        user: 'U2147483896',
        text: 'World',
        is_starred: true,
      },
      {
        type: 'something_else',
        ts: '1358546515.000007',
        wibblr: true,
      },
    ],
    has_more: true,
  }
  const mockObj2 = {
    ok: true,
    messages: [
      {
        type: 'message',
        ts: '1358546515.000008',
        user: 'U2147483896',
        text: 'Hello',
      },
      {
        type: 'message',
        ts: '1358546515.000007',
        user: 'U2147483896',
        text: 'World',
        is_starred: true,
      },
      {
        type: 'something_else',
        ts: '1358546515.000007',
        wibblr: true,
      },
    ],
    has_more: false,
  }
  const expectedResult = [
    {
      type: 'message',
      ts: '1358546515.000008',
      user: 'U2147483896',
      text: 'Hello',
      timestamp: 1358546515000,
      isoDate: '2013-01-18T22:01:55.000Z',
    },
    {
      type: 'message',
      ts: '1358546515.000007',
      user: 'U2147483896',
      text: 'World',
      is_starred: true,
      timestamp: 1358546515000,
      isoDate: '2013-01-18T22:01:55.000Z',
    },
    {
      type: 'something_else',
      ts: '1358546515.000007',
      wibblr: true,
      timestamp: 1358546515000,
      isoDate: '2013-01-18T22:01:55.000Z',
    },
    {
      type: 'message',
      ts: '1358546515.000008',
      user: 'U2147483896',
      text: 'Hello',
      timestamp: 1358546515000,
      isoDate: '2013-01-18T22:01:55.000Z',
    },
    {
      type: 'message',
      ts: '1358546515.000007',
      user: 'U2147483896',
      text: 'World',
      is_starred: true,
      timestamp: 1358546515000,
      isoDate: '2013-01-18T22:01:55.000Z',
    },
    {
      type: 'something_else',
      ts: '1358546515.000007',
      wibblr: true,
      timestamp: 1358546515000,
      isoDate: '2013-01-18T22:01:55.000Z',
    },
  ]
  const stub = sinon.stub(slackHistoryExport.slack, 'imHistory')
  stub.onFirstCall().returns(Promise.resolve(mockObj1))
  stub.onSecondCall().returns(Promise.resolve(mockObj2))


  const outputStream = streamTest['v2'].toText((err, result) => {
    t.notOk(err, 'No error occurred')
    const _result = JSON.parse(result)
    t.deepEqual(_result, expectedResult)
    slackHistoryExport.slack.imHistory.restore()
    t.end()
  })
  slackHistoryExport.fetchIMHistory(outputStream, 'CHANNEL', null, false)
})

test(`SlackHistoryExport::fetchGroupHistory
  should fetchAll group histories and stream out`, (t) => {
  const slackHistoryExport = new SlackHistoryExport({ token: SLACK_API_TOKEN })
  const mockObj = {
    ok: true,
    messages: [
      {
        type: 'message',
        ts: '1358546515.000008',
        user: 'U2147483896',
        text: 'Hello',
      },
      {
        type: 'message',
        ts: '1358546515.000007',
        user: 'U2147483896',
        text: 'World',
        is_starred: true,
      },
      {
        type: 'something_else',
        ts: '1358546515.000007',
        wibblr: true,
      },
    ],
    has_more: false,
  }
  const expectedResult = [
    {
      type: 'message',
      ts: '1358546515.000008',
      user: 'U2147483896',
      text: 'Hello',
      timestamp: 1358546515000,
      isoDate: '2013-01-18T22:01:55.000Z',
    },
    {
      type: 'message',
      ts: '1358546515.000007',
      user: 'U2147483896',
      text: 'World',
      is_starred: true,
      timestamp: 1358546515000,
      isoDate: '2013-01-18T22:01:55.000Z',
    },
    {
      type: 'something_else',
      ts: '1358546515.000007',
      wibblr: true,
      timestamp: 1358546515000,
      isoDate: '2013-01-18T22:01:55.000Z',
    },
  ]
  slackHistoryExport.slack = {
    groupHistory: () => Promise.resolve(mockObj),
  }
  const outputStream = streamTest['v2'].toText((err, result) => {
    t.notOk(err, 'No error occurred')
    const _result = JSON.parse(result)
    t.deepEqual(_result, expectedResult)
    t.end()
  })
  slackHistoryExport.fetchGroupHistory(outputStream, 'CHANNEL', null, false)
})

test(`SlackHistoryExport::fetchGroupHistory
  should fetch more group history and stream out`, (t) => {
  const slackHistoryExport = new SlackHistoryExport({ token: SLACK_API_TOKEN })
  const mockObj1 = {
    ok: true,
    messages: [
      {
        type: 'message',
        ts: '1358546515.000008',
        user: 'U2147483896',
        text: 'Hello',
      },
      {
        type: 'message',
        ts: '1358546515.000007',
        user: 'U2147483896',
        text: 'World',
        is_starred: true,
      },
      {
        type: 'something_else',
        ts: '1358546515.000007',
        wibblr: true,
      },
    ],
    has_more: true,
  }
  const mockObj2 = {
    ok: true,
    messages: [
      {
        type: 'message',
        ts: '1358546515.000008',
        user: 'U2147483896',
        text: 'Hello',
      },
      {
        type: 'message',
        ts: '1358546515.000007',
        user: 'U2147483896',
        text: 'World',
        is_starred: true,
      },
      {
        type: 'something_else',
        ts: '1358546515.000007',
        wibblr: true,
      },
    ],
    has_more: false,
  }
  const expectedResult = [
    {
      type: 'message',
      ts: '1358546515.000008',
      user: 'U2147483896',
      text: 'Hello',
      timestamp: 1358546515000,
      isoDate: '2013-01-18T22:01:55.000Z',
    },
    {
      type: 'message',
      ts: '1358546515.000007',
      user: 'U2147483896',
      text: 'World',
      is_starred: true,
      timestamp: 1358546515000,
      isoDate: '2013-01-18T22:01:55.000Z',
    },
    {
      type: 'something_else',
      ts: '1358546515.000007',
      wibblr: true,
      timestamp: 1358546515000,
      isoDate: '2013-01-18T22:01:55.000Z',
    },
    {
      type: 'message',
      ts: '1358546515.000008',
      user: 'U2147483896',
      text: 'Hello',
      timestamp: 1358546515000,
      isoDate: '2013-01-18T22:01:55.000Z',
    },
    {
      type: 'message',
      ts: '1358546515.000007',
      user: 'U2147483896',
      text: 'World',
      is_starred: true,
      timestamp: 1358546515000,
      isoDate: '2013-01-18T22:01:55.000Z',
    },
    {
      type: 'something_else',
      ts: '1358546515.000007',
      wibblr: true,
      timestamp: 1358546515000,
      isoDate: '2013-01-18T22:01:55.000Z',
    },
  ]
  const stub = sinon.stub(slackHistoryExport.slack, 'groupHistory')
  stub.onFirstCall().returns(Promise.resolve(mockObj1))
  stub.onSecondCall().returns(Promise.resolve(mockObj2))


  const outputStream = streamTest['v2'].toText((err, result) => {
    t.notOk(err, 'No error occurred')
    const _result = JSON.parse(result)
    t.deepEqual(_result, expectedResult)
    slackHistoryExport.slack.groupHistory.restore()
    t.end()
  })
  slackHistoryExport.fetchGroupHistory(outputStream, 'CHANNEL', null, false)
})

test(`SlackHistoryExport::fetchChannelHistory
  should fetchAll channel histories and stream out`, (t) => {
  const slackHistoryExport = new SlackHistoryExport({ token: SLACK_API_TOKEN })
  const mockObj = {
    ok: true,
    messages: [
      {
        type: 'message',
        ts: '1358546515.000008',
        user: 'U2147483896',
        text: 'Hello',
      },
      {
        type: 'message',
        ts: '1358546515.000007',
        user: 'U2147483896',
        text: 'World',
        is_starred: true,
      },
      {
        type: 'something_else',
        ts: '1358546515.000007',
        wibblr: true,
      },
    ],
    has_more: false,
  }
  const expectedResult = [
    {
      type: 'message',
      ts: '1358546515.000008',
      user: 'U2147483896',
      text: 'Hello',
      timestamp: 1358546515000,
      isoDate: '2013-01-18T22:01:55.000Z',
    },
    {
      type: 'message',
      ts: '1358546515.000007',
      user: 'U2147483896',
      text: 'World',
      is_starred: true,
      timestamp: 1358546515000,
      isoDate: '2013-01-18T22:01:55.000Z',
    },
    {
      type: 'something_else',
      ts: '1358546515.000007',
      wibblr: true,
      timestamp: 1358546515000,
      isoDate: '2013-01-18T22:01:55.000Z',
    },
  ]
  slackHistoryExport.slack = {
    channelHistory: () => Promise.resolve(mockObj),
  }
  const outputStream = streamTest['v2'].toText((err, result) => {
    t.notOk(err, 'No error occurred')
    const _result = JSON.parse(result)
    t.deepEqual(_result, expectedResult)
    t.end()
  })
  slackHistoryExport.fetchChannelHistory(outputStream, 'CHANNEL', null, false)
})

test(`SlackHistoryExport::fetchChannelHistory
  should fetch more channel history and stream out`, (t) => {
  const slackHistoryExport = new SlackHistoryExport({ token: SLACK_API_TOKEN })
  const mockObj1 = {
    ok: true,
    messages: [
      {
        type: 'message',
        ts: '1358546515.000008',
        user: 'U2147483896',
        text: 'Hello',
      },
      {
        type: 'message',
        ts: '1358546515.000007',
        user: 'U2147483896',
        text: 'World',
        is_starred: true,
      },
      {
        type: 'something_else',
        ts: '1358546515.000007',
        wibblr: true,
      },
    ],
    has_more: true,
  }
  const mockObj2 = {
    ok: true,
    messages: [
      {
        type: 'message',
        ts: '1358546515.000008',
        user: 'U2147483896',
        text: 'Hello',
      },
      {
        type: 'message',
        ts: '1358546515.000007',
        user: 'U2147483896',
        text: 'World',
        is_starred: true,
      },
      {
        type: 'something_else',
        ts: '1358546515.000007',
        wibblr: true,
      },
    ],
    has_more: false,
  }
  const expectedResult = [
    {
      type: 'message',
      ts: '1358546515.000008',
      user: 'U2147483896',
      text: 'Hello',
      timestamp: 1358546515000,
      isoDate: '2013-01-18T22:01:55.000Z',
    },
    {
      type: 'message',
      ts: '1358546515.000007',
      user: 'U2147483896',
      text: 'World',
      is_starred: true,
      timestamp: 1358546515000,
      isoDate: '2013-01-18T22:01:55.000Z',
    },
    {
      type: 'something_else',
      ts: '1358546515.000007',
      wibblr: true,
      timestamp: 1358546515000,
      isoDate: '2013-01-18T22:01:55.000Z',
    },
    {
      type: 'message',
      ts: '1358546515.000008',
      user: 'U2147483896',
      text: 'Hello',
      timestamp: 1358546515000,
      isoDate: '2013-01-18T22:01:55.000Z',
    },
    {
      type: 'message',
      ts: '1358546515.000007',
      user: 'U2147483896',
      text: 'World',
      is_starred: true,
      timestamp: 1358546515000,
      isoDate: '2013-01-18T22:01:55.000Z',
    },
    {
      type: 'something_else',
      ts: '1358546515.000007',
      wibblr: true,
      timestamp: 1358546515000,
      isoDate: '2013-01-18T22:01:55.000Z',
    },
  ]
  const stub = sinon.stub(slackHistoryExport.slack, 'channelHistory')
  stub.onFirstCall().returns(Promise.resolve(mockObj1))
  stub.onSecondCall().returns(Promise.resolve(mockObj2))


  const outputStream = streamTest['v2'].toText((err, result) => {
    t.notOk(err, 'No error occurred')
    const _result = JSON.parse(result)
    t.deepEqual(_result, expectedResult)
    slackHistoryExport.slack.channelHistory.restore()
    t.end()
  })
  slackHistoryExport.fetchChannelHistory(outputStream, 'CHANNEL', null, false)
})

test(`SlackHistoryExport::processIMs
  should fetchAll userHistory and stream out`, (t) => {
  const mockUserObj = {
    id: 'G0LPPVBHN',
    user: 'SLACKBOT',
  }
  const mockUserObj2 = {
    id: 'G0LPPVBH2',
    user: 'Abi',
  }
  const mockObj = {
    ok: true,
    messages: [
      {
        type: 'message',
        ts: '1358546515.000008',
        user: 'U2147483896',
        text: 'Hello',
      },
      {
        type: 'message',
        ts: '1358546515.000007',
        user: 'U2147483896',
        text: 'World',
        is_starred: true,
      },
      {
        type: 'something_else',
        ts: '1358546515.000007',
        wibblr: true,
      },
    ],
    has_more: false,
  }
  const slackHistoryExport = new SlackHistoryExport({
    token: SLACK_API_TOKEN,
    username: 'Abi',
  })
  const userDetailStub = sinon.stub(slackHistoryExport, 'fetchUserDetail')
  userDetailStub.onFirstCall().returns(Promise.resolve(mockUserObj))
  const imInfoStub = sinon.stub(slackHistoryExport, 'fetchIMInfo')
  imInfoStub.onFirstCall().returns(Promise.resolve(mockUserObj2))
  const IMHistoryStub = sinon.stub(
    slackHistoryExport,
    'fetchIMHistory',
  ).callsFake(
    (stream) => {
      stream.end(JSON.stringify(mockObj.messages))
    },
  )
  const outputStream = streamTest['v2'].toText((err, result) => {
    t.notOk(err, 'No error occurred')
    const _result = JSON.parse(result)
    t.deepEqual(_result, mockObj.messages)
    t.equal(
      IMHistoryStub.args[0][1],
      mockUserObj2.id,
      'IMInfo id is passed as 2nd argument to fetchIMHistory method',
    )
    t.equal(
      userDetailStub.args[0][0],
      'Abi',
      'username is passed to fetchUserDetail method',
    )
    t.deepEqual(
      imInfoStub.args[0][0],
      mockUserObj,
      'user object is passed to fetchIMInfo method',
    )
    t.end()
  })
  slackHistoryExport.processIMs(outputStream)
})

test(`SlackHistoryExport::processGroups
  should fetchAll group history and stream out`, (t) => {
  const mockGroupObj = {
    id: 'G0LPPVBHN',
    name: 'admins',
  }
  const mockObj = {
    ok: true,
    messages: [
      {
        type: 'message',
        ts: '1358546515.000008',
        user: 'U2147483896',
        text: 'Hello',
      },
      {
        type: 'message',
        ts: '1358546515.000007',
        user: 'U2147483896',
        text: 'World',
        is_starred: true,
      },
      {
        type: 'something_else',
        ts: '1358546515.000007',
        wibblr: true,
      },
    ],
    has_more: false,
  }
  const slackHistoryExport = new SlackHistoryExport({ token: SLACK_API_TOKEN })
  const groupDetailStub = sinon.stub(slackHistoryExport, 'fetchGroupDetails')
  groupDetailStub.onFirstCall().returns(Promise.resolve(mockGroupObj))
  const groupHistoryStub = sinon.stub(
    slackHistoryExport,
    'fetchGroupHistory',
  ).callsFake(
    (stream) => {
      stream.end(JSON.stringify(mockObj.messages))
    },
  )

  const outputStream = streamTest['v2'].toText((err, result) => {
    t.notOk(err, 'No error occurred')
    const _result = JSON.parse(result)
    t.deepEqual(_result, mockObj.messages)
    t.equal(
      groupHistoryStub.args[0][1],
      mockGroupObj.id,
      'Group id is passed as 2nd argument to fetchGroupHistory method',
    )
    t.end()
  })
  slackHistoryExport.processGroups(outputStream)
})

test(`SlackHistoryExport::processChannels
  should fetchAll channel history and stream out`, (t) => {
  const mockChannelObj = {
    id: 'G0LPPVBHN',
    name: 'general',
  }
  const mockObj = {
    ok: true,
    messages: [
      {
        type: 'message',
        ts: '1358546515.000008',
        user: 'U2147483896',
        text: 'Hello',
      },
      {
        type: 'message',
        ts: '1358546515.000007',
        user: 'U2147483896',
        text: 'World',
        is_starred: true,
      },
      {
        type: 'something_else',
        ts: '1358546515.000007',
        wibblr: true,
      },
    ],
    has_more: false,
  }
  const slackHistoryExport = new SlackHistoryExport({ token: SLACK_API_TOKEN })
  const chanDetailStub = sinon.stub(slackHistoryExport, 'fetchChannelDetails')
  chanDetailStub.onFirstCall().returns(Promise.resolve(mockChannelObj))
  const chanHistoryStub = sinon.stub(
    slackHistoryExport,
    'fetchChannelHistory',
  ).callsFake(
    (stream) => {
      stream.end(JSON.stringify(mockObj.messages))
    })


  const outputStream = streamTest['v2'].toText((err, result) => {
    t.notOk(err, 'No error occurred')
    const _result = JSON.parse(result)
    t.deepEqual(_result, mockObj.messages)
    t.equal(
      chanHistoryStub.args[0][1],
      mockChannelObj.id,
      'Channel id is passed as 2nd argument to fetchGroupHistory method',
    )
    t.end()
  })
  slackHistoryExport.processChannels(outputStream)
})

test(`SlackHistoryExport::fetchIMInfo
  should return an error if userInfo does not exist`, (t) => {
  const slackHistoryExport = new SlackHistoryExport({ token: SLACK_API_TOKEN })
  slackHistoryExport.slack = {
    im: () => Promise.resolve({
      ims: [
        {
          user: 'USLACKBOT',
        },
        {
          user: 'U024BE7LH',
        },
      ],
    }),
  }
  const mockUserObj = {
    id: 'INVALID',
    user: 'SLACKBOT',
  }
  slackHistoryExport.fetchIMInfo(mockUserObj)
    .then(t.fail)
    .catch((error) => {
      t.equal(
        error,
        'You do not have any IM history with this user:SLACKBOT',
        'Error is returned if no imInfo is found',
      )
      t.end()
    })
})
