module.exports = {
  cmd: ["menu"],
  name: "menu",
  category: "main",
  async execute(m, { client, commands }) {
      let categories = {}
      commands.forEach((command) => {
        const category = command.category || "others"
        if (!categories[category]) {
          categories[category] = []
        }
        categories[category].push(command)
      })
      const im = String.fromCharCode(8206)
      const r = im.repeat(4001)
      let moment = require("moment-timezone")
      let jm = moment().tz("Asia/Makassar").format("HH:mm:ss")
      let hari = { timeZone: "Asia/Makassar", weekday: "long" }
      let hri = new Intl.DateTimeFormat("id-ID", hari).format(new Date())
      let dt = { year: 'numeric', month: 'long', day: 'numeric' }
      let date = new Intl.DateTimeFormat('id-ID', dt).format(new Date())
      
      let menuText = `
*乂 ɪ ɴ ғ ᴏ  ᴜ s ᴇ ʀ*
> ɴᴀᴍᴇ : ${m.pushName}
> ʟɪᴍɪᴛ : NaN
> ʀᴏʟᴇ : -
–
*乂 ᴛ ᴏ ᴅ ᴀ ʏ*
> *ᴊᴀᴍ : ${jm} ᴡɪT*
> *ʜᴀʀɪ : ${hri}*
> *ᴅᴀᴛᴇ : ${date}*
> *ʀᴜɴᴛɪᴍᴇ : ${(wokk(process.uptime()))}*
> *ᴜsᴇʀs : NaN*\n${r}`
      Object.keys(categories).forEach((category) => {
        menuText += `\n— *${category.toUpperCase()}*\n`
        categories[category].forEach((command) => {
          menuText += `> — 々 ${m.prefix}${command.cmd.join(" / ")}\n`
        })
        menuText += "\n"
      })

      await m.reply(menuText + "\n" + "> ᵀʰⁱˢ ˢⁱᵐᵖˡᵉ ᴾʳᵒʲᵉᶜᵗˢ ᶜʳᵉᵃᵗᵉᵈ ᴮʸ ᵇᵃˡˣᶻᶻʸ")
  },
}
function wokk(seconds) {
        seconds = Number(seconds)
        var d = Math.floor(seconds / (3600 * 24)) 
        var h = Math.floor((seconds % (3600 * 24)) / 3600)
        var m = Math.floor((seconds % 3600) / 60) 
        var s = Math.floor(seconds % 60) 
        var dDisplay = d > 0 ? d + "d, " : ""
        var hDisplay = h > 0 ? h + "h, " : ""
        var mDisplay = m > 0 ? m + "m, " : ""
        var sDisplay = s > 0 ? s + "s" : ""
        return (dDisplay + hDisplay + mDisplay + sDisplay).trim().replace(/,\s*$/, "")
}