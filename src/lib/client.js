const {
  default: WAConnect,
  makeInMemoryStore,
  Browsers,
  fetchLatestBaileysVersion,
  fetchLatestWaWebVersion,
  useMultiFileAuthState,
} = require("@whiskeysockets/baileys")
const { Client } = require("../lib/serialize")
const pino = require("pino")

const createClient = async (options = {}) => {
  const logger = pino({
    timestamp: () => `,"time":"${new Date().toJSON()}"`,
  }).child({ class: "client" })
  logger.level = "fatal"
  const store = makeInMemoryStore({ logger })

  const { state, saveCreds } = await useMultiFileAuthState(options.session)
  const client = WAConnect({
    logger: pino({ level: "silent" }),
    printQRInTerminal: true,
    browser: Browsers.ubuntu("Chrome"),
    auth: state,
    ...options,
  })
  store.bind(client.ev)
  await Client({ client, store })

  return { client, saveCreds, store }
}

async function getWAVersion() {
  try {
    const { version, isLatest } = await fetchLatestWaWebVersion()
    return { version, isLatest }
  } catch (err) {
    const { version, isLatest } = await fetchLatestBaileysVersion()
    return { version, isLatest }
  }
}

module.exports = { createClient, getWAVersion }