const { yts, ytmp3, ytmp4 } = require("@balxz/this-ytdl").default

module.exports = {
  cmd: ["play"],
  name: "play",
  category: "downloader",
  description: "Download Your Audio",
  async execute(m, { client, text }) {
      if(!text) return m.reply("Ex?: .play Fix You - Coldplay")
      let c = await yts(text).then(a => a.data.url)
      await m.reply("``Searching . . .```")
      let a = await ytmp3(c).then(v => v.data)
      await m.reply("``Downloding . . .```")
      return await client.sendMessage(m.from, {
        audio: {
          url: a.download
        },
        mimetype: 'audio/mp4', 
        fileName: a.title, 
        contextInfo: {
          externalAdReply: {
            showAdAttribution: true,
            mediaType: 2,
            mediaUrl: "https://api.balzz.my.id",
            title: a.title,
            body: "Shiina-Mahiru",
            sourceUrl: "https://github.com/balxz",
            thumbnail: a.imej
          }
        }
      }, { quoted: m })
   },
}