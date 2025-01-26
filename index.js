const config = require("./src/configs/config")
const { delay, jidNormalizedUser } = require("@whiskeysockets/baileys")
const { createClient, getWAVersion } = require("./src/lib/client")
const { handleMessagesUpsert } = require("./src/events/messageHandler")
const { serialize } = require("./src/lib/serialize")
const { getRandomEmoji } = require("./src/lib/emoji")
const { formatSize, parseFileSize, sendTelegram } = require("./src/lib/function")

const fs = require("fs")
const os = require("os")
const { exec } = require("child_process")

const pairingCode = config.pairingNumber 
  
const pathContacts = `./${config.session}/contacts.json`
const pathMetadata = `./${config.session}/groupMetadata.json`

async function WAStart() {
  const { version, isLatest } = await getWAVersion()
  console.log(`\x1b[35mUse Library Version v${version.join(".")}, Latest Version ${isLatest}\x1b[0m`)

  const { client, saveCreds, store } = await createClient({
    session: config.session,
  })

  if (config.writeStore === "true")
    store.readFromFile(`./${config.session}/store.json`)

  if (pairingCode && !client.authState.creds.registered) {
    let phoneNumber = pairingCode.replace(/[^0-9]/g, '')
    
    await delay(3000)
    let code = await client.requestPairingCode(phoneNumber)
    code = code?.match(/.{1,4}/g)?.join("-") || code
    console.log(`Your Pairing Code: ` + code)
  }

  if (config.autoOnline) {
    console.log("\x1b[34mAUTO ONLINE IS ACTIVATED.")
    client.ev.on("connection.update", async (update) => {
      const { connection } = update
      if (connection === "open") {
        console.log("\x1b[34mConected . . .")
        await client.sendPresenceUpdate("available", "status@broadcast")
      } else if (connection === "close") {
        console.log("\x1b[31mConnection Lost, Trying To Reconnect . . .")
        WAStart();
      }
    })
  } else {
    console.log("\x1b[34mAUTO ONLINE IS ACTIVATED.")
  }

  client.ev.on("creds.update", saveCreds)

  /** contacts **/
  if (fs.existsSync(pathContacts)) {
    store.contacts = JSON.parse(fs.readFileSync(pathContacts, "utf-8"))
  } else {
    fs.writeFileSync(pathContacts, JSON.stringify({}))
  }
  
  /** group metadata **/
  if (fs.existsSync(pathMetadata)) {
    store.groupMetadata = JSON.parse(fs.readFileSync(pathMetadata, "utf-8"))
  } else {
    fs.writeFileSync(pathMetadata, JSON.stringify({}))
  }

  /** add contacts update to store **/
  client.ev.on("contacts.update", (update) => {
    for (let contact of update) {
      let id = jidNormalizedUser(contact.id)
      if (store && store.contacts)
        store.contacts[id] = {
          ...(store.contacts?.[id] || {}),
          ...(contact || {}),
        }
    }
  })

  /** add contacts upsert to store **/
  client.ev.on("contacts.upsert", (update) => {
    for (let contact of update) {
      let id = jidNormalizedUser(contact.id)
      if (store && store.contacts)
        store.contacts[id] = { ...(contact || {}), isContact: true }
    }
  })

  /** nambah perubahan grup ke store **/
  client.ev.on("groups.update", (updates) => {
    for (const update of updates) {
      const id = update.id
      if (store.groupMetadata[id]) {
        store.groupMetadata[id] = {
          ...(store.groupMetadata[id] || {}),
          ...(update || {}),
        }
      }
    }
  })

  /** merubah status member **/
  client.ev.on("group-participants.update", ({ id, participants, action }) => {
    const metadata = store.groupMetadata[id]
    if (metadata) {
      switch (action) {
        case "add":
        case "revoked_membership_requests":
          metadata.participants.push(
            ...participants.map((id) => ({
              id: jidNormalizedUser(id),
              admin: null,
            })),
          )
          break
          
        case "demote":
        case "promote":
          for (const participant of metadata.participants) {
            let id = jidNormalizedUser(participant.id)
            if (participants.includes(id)) {
              participant.admin = action === "promote" ? "admin" : null
            }
          }
          break
          
        case "remove":
          metadata.participants = metadata.participants.filter(
            (p) => !participants.includes(jidNormalizedUser(p.id)),
          )
          break
      } // pembatas kocak 
      
    }
  });

  client.ev.on("messages.upsert", async ({ messages }) => {
    if (!messages[0].message) return
    let m = await serialize(client, messages[0], store)
    if (store.groupMetadata && Object.keys(store.groupMetadata).length === 0)
      store.groupMetadata = await client.groupFetchAllParticipating()
    if (m.key && !m.key.fromMe && m.key.remoteJid === "status@broadcast") {
    if (m.type === "protocolMessage" && m.message.protocolMessage.type === 0)
        return
        
      await client.readMessages([m.key])
      let id = m.key.participant
      let name = client.getName(id)
      
	  if (config.TeleIDBot && config.TeleIDOwn) {
		 if (m.isMedia) {
			 let media = await client.downloadMediaMessage(m)
		     let caption = `From ${id.split('@')[0]} (${name})${m.body ? `\n\n${m.body}` : ''}`
			await sendTelegram(config.TeleIDOwn, media, { type: /audio/.test(m.msg.mimetype) ? 'document' : '', caption })
				} else await sendTelegram(config.TeleIDOwn, `From ${id.split('@')[0]} (${name})\n\n${m.body}`)
			}
					
      try {
        const randomEmoji = getRandomEmoji()
        await client.sendMessage(
          "status@broadcast",
          { react: { text: randomEmoji, key: m.key } },
          { statusJidList: [m.key.participant] },
        )
        console.log(`\x1b[34mMemberi Reaksi Ke Story (${m.key.participant})`)
      } catch (e) {
        console.log("\x1b[31mFailed To React Stories: ", e)
      }
    }
    await handleMessagesUpsert(client, store, m)
  })

  setInterval(async () => {
  
    /** write contacts and metadata **/
    if (store.groupMetadata)
      fs.writeFileSync(pathMetadata, JSON.stringify(store.groupMetadata))
    if (store.contacts)
      fs.writeFileSync(pathContacts, JSON.stringify(store.contacts))

    /** write store **/
    if (config.writeStore)
      store.writeToFile(`./${config.session}/store.json`)

  }, 10 * 1000) // tiap 10 detik

  process.on("uncaughtException", console.error)
  process.on("unhandledRejection", console.error)
}

WAStart()