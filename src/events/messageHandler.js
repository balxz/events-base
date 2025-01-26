const config = require("../configs/config")

const { delay, jidNormalizedUser } = require("@whiskeysockets/baileys")
const util = require("util")
const { exec } = require("child_process")
const fs = require("fs")
const path = require("path")

const Func = require("../lib/function.js")
const Color = require("../lib/color.js")
const { serialize, getContentType } = require("../lib/serialize.js")

const commands = new Map()

const loadCommands = () => {
  commands.clear()

  const commandFiles = fs
    .readdirSync(path.join(__dirname, "../commands"))
    .filter((file) => file.endsWith(".js"))

  for (const file of commandFiles) {
    const command = require(`../commands/${file}`)
    command.cmd.forEach((cmdName) => {
      commands.set(cmdName, command)
    })
  }
}

const watchCommands = () => {
  const commandsPath = path.join(__dirname, "../commands")

  fs.watch(commandsPath, (eventType, filename) => {
    if (filename) {
      const filePath = path.join(commandsPath, filename)
      if (eventType === "change") {
        delete require.cache[require.resolve(filePath)]
        loadCommands()
        console.log(Color.greenBright(`Command file updated: ${filename}`))
      } else if (eventType === "rename") {
        if (fs.existsSync(filePath)) {
          // File ditambahkan
          delete require.cache[require.resolve(filePath)]
          loadCommands()
          console.log(Color.blueBright(`New command added: ${filename}`))
        } else {
          // File dihapus
          loadCommands()
          console.log(Color.redBright(`Command removed: ${filename}`))
        }
      }
    }
  })
}

loadCommands()
watchCommands()

const handleMessagesUpsert = async (client, store, m) => {
  try {
    let quoted = m.isQuoted ? m.quoted : m
    let downloadM = async (filename) =>
      await client.downloadMediaMessage(quoted, filename)
      
    if (m.isBot) return
    if (config.self && !m.isOwner) return
    
    if (m.message && !m.isBot) {
      console.log(
        Color.cyan("Dari"),
        Color.cyan(client.getName(m.from)),
        Color.blueBright(m.from),
      )
      console.log(
        Color.yellowBright("Chat"),
        Color.yellowBright(
          m.isGroup
            ? `Grup (${m.sender} : ${client.getName(m.sender)})`
            : "Pribadi",
        ),
      )
      console.log(
        Color.greenBright("Pesan :"),
        Color.greenBright(m.body || m.type),
      )
    }

    if (config.autoReadMessage && !m.key.fromMe) {
      try {
        await client.readMessages([m.key])
      } catch (error) {
        console.error("Error auto-reading message:", error)
      }
    }

    // eval
    if (
      [">", "eval", "=>"].some((a) => m.command.toLowerCase().startsWith(a)) &&
      m.isOwner
    ) {
      let evalCmd = ""
      try {
        evalCmd = /await/i.test(m.text)
          ? eval("(async() => { " + m.text + " })()")
          : eval(m.text)
      } catch (e) {
        evalCmd = e
      }
      new Promise((resolve, reject) => {
        try {
          resolve(evalCmd)
        } catch (err) {
          reject(err)
        }
      })
        ?.then((res) => m.reply(util.format(res)))
        ?.catch((err) => m.reply(util.format(err)))
    }

    // exec
    if (
      ["$", "exec"].some((a) => m.command.toLowerCase().startsWith(a)) &&
      m.isOwner
    ) {
      try {
        exec(m.text, async (err, stdout) => {
          if (err) return m.reply(util.format(err))
          if (stdout) return m.reply(util.format(stdout))
        })
      } catch (e) {
        await m.reply(util.format(e))
      }
    }

    if (m.prefix) {
      const { args, text } = m
      const isCommand = m.prefix && m.body.startsWith(m.prefix)
      const commandName = isCommand ? m.command.toLowerCase() : false

      if (commandName && commands.has(commandName)) {
        const command = commands.get(commandName)
        const isAccept = Array.isArray(command.cmd)
          ? command.cmd.includes(commandName)
          : false

        if (isAccept) {
          try {
            await command.execute(m, { client, args, text, quoted, commands, store })
          } catch (error) {
            console.error(`Error executing command ${commandName}:`, error)
            await m.reply(util.format(error))
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in handleMessagesUpsert:", error)
    await m.reply(util.format(err))
  }
}

module.exports = { handleMessagesUpsert }
