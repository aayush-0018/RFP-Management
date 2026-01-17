const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');

const imapConfig = {
    imap: {
        user: process.env.IMAP_USER,
        password: process.env.IMAP_PASS,
        host: process.env.IMAP_HOST,
        port: process.env.IMAP_PORT,
        tls: true,
        tls: true,
        tlsOptions: {
            rejectUnauthorized: false,
        },
        authTimeout: 3000,
    },
};

const fetchUnreadEmails = async () => {
    const connection = await imaps.connect(imapConfig);
    await connection.openBox('INBOX');

    const since = new Date(Date.now() - 4 * 60 * 60 * 1000);



    const searchCriteria = ['UNSEEN', ['SINCE', since.toISOString()]];
    const fetchOptions = { bodies: [''], markSeen: false };

    const messages = await connection.search(searchCriteria, fetchOptions);

    const parsedEmails = [];

    for (const item of messages) {
        const all = item.parts.find(p => p.which === '');
        const parsed = await simpleParser(all.body);

        parsedEmails.push({
            from: parsed.from.value[0].address,
            subject: parsed.subject,
            text: parsed.text,
            html: parsed.html,
        });
    }

    await connection.end();
    return parsedEmails;
};

module.exports = { fetchUnreadEmails };
