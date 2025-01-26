const { jidNormalizedUser } = require("@whiskeysockets/baileys");
const { getContentType } = require("../lib/serialize.js");

module.exports = {
  cmd: ["upsw"],
  name: "upsw",
  description: "Uplaod Story WhatsApp",
  async execute(m, { client, quoted, store }) {
    if (m.isOwner) {
      let statusJidList = [
        jidNormalizedUser(client.user.id),
        ...Object.values(store.contacts).map((v) => v.id),
      ];
      let colors = [
        "#7ACAA7",
        "#6E257E",
        "#5796FF",
        "#7E90A4",
        "#736769",
        "#57C9FF",
        "#25C3DC",
        "#FF7B6C",
        "#55C265",
        "#FF898B",
        "#8C6991",
        "#C69FCC",
        "#B8B226",
        "#EFB32F",
        "#AD8774",
        "#792139",
        "#C1A03F",
        "#8FA842",
        "#A52C71",
        "#8394CA",
        "#243640",
      ];
      let fonts = [0, 1, 2, 6, 7, 8, 9, 10];
      if (!quoted.isMedia) {
        let text = m.text || m.quoted?.body || "";
        if (!text) return m.reply("Mana text?");
        await client.sendMessage(
          "status@broadcast",
          { text },
          {
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            textArgb: 0xffffffff,
            font: fonts[Math.floor(Math.random() * colors.length)],
            statusJidList,
          },
        );
        await m.reply(`Up status ke : ${statusJidList.length} Kontak`);
      } else if (/audio/.test(quoted.msg.mimetype)) {
        await client.sendMessage(
          "status@broadcast",
          {
            audio: await quoted.download(),
            mimetype: "audio/mp4",
            ptt: true,
            waveform: [100, 0, 100, 0, 100, 0, 100],
          },
          {
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            statusJidList,
          },
        );
        await m.reply(`Up status ke : ${statusJidList.length} Kontak`);
      } else {
        let type = /image/.test(quoted.msg.mimetype)
          ? "image"
          : /video/.test(quoted.msg.mimetype)
            ? "video"
            : false;
        if (!type) throw "Type tidak didukung";
        await client.sendMessage(
          "status@broadcast",
          {
            [type]: await quoted.download(),
            caption: m.text || m.quoted?.body || "",
          },
          { statusJidList },
        );
        await m.reply(`Up status ke : ${statusJidList.length} Kontak`);
      }
    }
  },
};
